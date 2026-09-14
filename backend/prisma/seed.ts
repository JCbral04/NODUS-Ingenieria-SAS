// ============================================================================
// NODUS — Seed idempotente (puede ejecutarse N veces sin duplicar)
// Comando: npx prisma db seed   (requiere: npm i -D bcryptjs @types/bcryptjs)
// Credenciales demo (todas con la misma contraseña):
//   admin@nodus.co | advisory@nodus.co | cliente@acme.co | cliente@beta.co
//   consultor1@nodus.co | consultor2@nodus.co | consultor3@nodus.co
// ============================================================================

import { PrismaClient, CaseStatus, ConsultantStatus, ConsultantModality } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD ?? 'Nodus2026*'; // ¡cambiar en producción!

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10);

  // --------------------------------------------------------------------------
  // 1. Roles RBAC
  // --------------------------------------------------------------------------
  const roles = [
    { code: 'ADMIN', name: 'Administrador Plataforma' },
    { code: 'ADVISORY', name: 'Advisory NODUS (911MiPyme)' },
    { code: 'MIPYME', name: 'Mipyme Cliente' },
    { code: 'CONSULTOR', name: 'Consultor' },
    { code: 'REVISOR', name: 'Consultor Revisor (Fase 2)' },
  ];
  const roleMap: Record<string, number> = {};
  for (const r of roles) {
    const row = await prisma.role.upsert({ where: { code: r.code }, update: {}, create: r });
    roleMap[r.code] = row.id;
  }

  // --------------------------------------------------------------------------
  // 2. Gobierno LOV — taxonomías parametrizadas (RT-015/017)
  // --------------------------------------------------------------------------
  const lov: Record<string, string[]> = {
    AREA_PROBLEMA: ['Estrategia', 'Tecnología', 'Finanzas', 'Operaciones',
      'Legal / Cumplimiento', 'Talento Humano', 'Analítica / Datos', 'Transformación Digital'],
    TIPO_INTERVENCION: ['Diagnóstico', 'Evaluación especializada', 'Diseño de solución',
      'Implementación', 'Optimización', 'Acompañamiento estratégico'],
    NIVEL_COMPLEJIDAD: ['Bajo', 'Medio', 'Alto', 'Estratégico'],
    NIVEL_URGENCIA: ['Alta', 'Media', 'Baja'],
    NIVEL_IMPACTO: ['Crítico', 'Alto', 'Medio', 'Bajo'],
    NIVEL_CONSULTOR: ['Validado', 'Habilitado', 'Premium', 'Estratégico'],
    TIPO_INCIDENCIA: ['Retraso del cliente', 'Falta de información', 'Cambio de condiciones',
      'Bloqueo operativo', 'Riesgo de cronograma', 'Desviación de alcance'],
  };
  const lovMap: Record<string, Record<string, number>> = {};
  for (const [catCode, values] of Object.entries(lov)) {
    const cat = await prisma.lovCategory.upsert({
      where: { code: catCode },
      update: {},
      create: { code: catCode, name: catCode.replace(/_/g, ' ') },
    });
    lovMap[catCode] = {};
    for (let i = 0; i < values.length; i++) {
      const v = await prisma.lovValue.upsert({
        where: { categoryId_code: { categoryId: cat.id, code: values[i].toUpperCase().replace(/[\s\/]+/g, '_') } },
        update: {},
        create: {
          categoryId: cat.id,
          code: values[i].toUpperCase().replace(/[\s\/]+/g, '_'),
          label: values[i],
          sortOrder: i,
        },
      });
      lovMap[catCode][values[i]] = v.id;
    }
  }

  // --------------------------------------------------------------------------
  // 3. Reglas SLA por etapa (RT-006) — gobernadas, ajustables por admin
  // --------------------------------------------------------------------------
  const slaRules: Array<[CaseStatus, number, number]> = [
    [CaseStatus.CREADO, 24, 2],              // confirmación de recepción
    [CaseStatus.EN_REVISION, 48, 2],         // debida diligencia
    [CaseStatus.CLASIFICADO, 24, 2],         // publicación en bolsa
    [CaseStatus.EN_POSTULACION, 72, 2],      // ventana de postulación
    [CaseStatus.PROPUESTA_EN_DISENO, 120, 2],// diseño de propuesta
    [CaseStatus.PROPUESTA_ENVIADA, 96, 2],   // decisión del cliente
    [CaseStatus.PENDIENTE_CONTRATACION, 120, 3],
    [CaseStatus.EN_EJECUCION, 240, 3],
  ];
  for (const [fromStatus, hours, escalationLevel] of slaRules) {
    const existing = await prisma.slaRule.findFirst({ where: { fromStatus } });
    if (!existing) await prisma.slaRule.create({ data: { fromStatus, hours, escalationLevel } });
  }

  // --------------------------------------------------------------------------
  // 4. Usuarios demo — un actor por rol para recorrer el flujo completo
  // --------------------------------------------------------------------------
  const user = (email: string, fullName: string, roleCode: string) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: hash, fullName, roleId: roleMap[roleCode] },
    });

  const admin = await user('admin@nodus.co', 'Admin NODUS', 'ADMIN');
  const advisory = await user('advisory@nodus.co', 'Ana Advisory', 'ADVISORY');
  const clienteAcme = await user('cliente@acme.co', 'María Gómez', 'MIPYME');
  const clienteBeta = await user('cliente@beta.co', 'Pedro Prieto', 'MIPYME');
  const c1 = await user('consultor1@nodus.co', 'Carlos Rentería', 'CONSULTOR');
  const c2 = await user('consultor2@nodus.co', 'Diana Salgado', 'CONSULTOR');
  const c3 = await user('consultor3@nodus.co', 'Óscar Peña', 'CONSULTOR');

  // --------------------------------------------------------------------------
  // 5. Empresas únicas + contactos (onboarding Punto 1)
  // --------------------------------------------------------------------------
  const acme = await prisma.company.upsert({
    where: { taxId: '901123456-1' },
    update: {},
    create: {
      name: 'Acme Colombia SAS', taxId: '901123456-1', email: 'contacto@acme.co',
      emailDomain: 'acme.co', country: 'Colombia', city: 'Bogotá',
      contacts: {
        create: {
          userId: clienteAcme.id, fullName: 'María Gómez', position: 'Gerente General',
          email: 'cliente@acme.co', phone: '3001234567', isPrimary: true,
        },
      },
    },
    include: { contacts: true },
  });
  const beta = await prisma.company.upsert({
    where: { taxId: '901765432-2' },
    update: {},
    create: {
      name: 'Beta Foods Ltda', taxId: '901765432-2', email: 'contacto@betafoods.co',
      emailDomain: 'betafoods.co', country: 'Colombia', city: 'Medellín',
      contacts: {
        create: {
          userId: clienteBeta.id, fullName: 'Pedro Prieto', position: 'Subgerente',
          email: 'cliente@beta.co', phone: '3007654321', isPrimary: true,
        },
      },
    },
    include: { contacts: true },
  });

  // --------------------------------------------------------------------------
  // 6. Perfiles de consultores (ecosistema TC1–TC3)
  // --------------------------------------------------------------------------
  const consultants = [
    { user: c1, spec: 'Tecnología', level: 'Premium', modality: ConsultantModality.INDEPENDIENTE, years: 12 },
    { user: c2, spec: 'Finanzas', level: 'Habilitado', modality: ConsultantModality.SPONSOR, years: 8, sponsor: 'Firma Alianza SAS' },
    { user: c3, spec: 'Operaciones', level: 'Habilitado', modality: ConsultantModality.PROPIO, years: 6 },
  ];
  const consultantIds: number[] = [];
  for (const c of consultants) {
    const row = await prisma.consultant.upsert({
      where: { userId: c.user.id },
      update: {},
      create: {
        userId: c.user.id,
        specialtyId: lovMap['AREA_PROBLEMA'][c.spec],
        levelCode: c.level,
        modality: c.modality,
        sponsorName: c.sponsor ?? null,
        status: ConsultantStatus.HABILITADO,
        experienceYears: c.years,
        availability: true,
      },
    });
    consultantIds.push(row.id);
  }

  // --------------------------------------------------------------------------
  // 7. Casos demo en distintos estados — el evaluador recorre el pipeline
  // --------------------------------------------------------------------------
  type SeedCase = {
    num: string; company: typeof acme; title: string; description: string;
    status: CaseStatus; area: string; consultantIdx?: number;
  };
  const cases: SeedCase[] = [
    { num: 'CAS-000001', company: acme, status: CaseStatus.CREADO, area: 'Tecnología',
      title: 'Digitalización de inventarios',
      description: 'Necesitamos migrar el control de inventarios de Excel a un sistema integrado con nuestro punto de venta.' },
    { num: 'CAS-000002', company: beta, status: CaseStatus.EN_REVISION, area: 'Finanzas',
      title: 'Estructuración de estados financieros',
      description: 'Requerimos ordenar la información financiera para acceder a crédito bancario.' },
    { num: 'CAS-000003', company: acme, status: CaseStatus.EN_POSTULACION, area: 'Tecnología',
      title: 'Implementación de tablero de indicadores',
      description: 'Queremos un dashboard gerencial con KPIs de ventas, inventario y cartera.' },
    { num: 'CAS-000004', company: beta, status: CaseStatus.ASIGNADO, area: 'Operaciones', consultantIdx: 2,
      title: 'Optimización de rutas de distribución',
      description: 'Buscamos reducir costos logísticos en la distribución urbana.' },
    { num: 'CAS-000005', company: acme, status: CaseStatus.CERRADO, area: 'Finanzas', consultantIdx: 1,
      title: 'Diagnóstico financiero 2025',
      description: 'Diagnóstico integral realizado y entregado exitosamente.' },
  ];

  for (const sc of cases) {
    const existing = await prisma.case.findUnique({ where: { caseNumber: sc.num } });
    if (existing) continue;
    const contact = sc.company.contacts[0];
    const created = await prisma.case.create({
      data: {
        caseNumber: sc.num,
        companyId: sc.company.id,
        contactId: contact.id,
        title: sc.title,
        description: sc.description,
        areaId: lovMap['AREA_PROBLEMA'][sc.area],
        urgencyId: lovMap['NIVEL_URGENCIA']['Media'],
        impactId: lovMap['NIVEL_IMPACTO']['Medio'],
        status: sc.status,
        assignedConsultantId: sc.consultantIdx != null ? consultantIds[sc.consultantIdx] : null,
      },
    });
    // Bitácora de la transición inicial (RT-001/003)
    await prisma.caseStateHistory.create({
      data: { caseId: created.id, fromStatus: null, toStatus: created.status, actorId: advisory.id },
    });
    await prisma.auditLog.create({
      data: {
        actorId: advisory.id, action: 'CREATE', entity: 'Case', entityId: created.id,
        caseId: created.id, prevState: null, newState: created.status,
        metadata: { caseNumber: sc.num },
      },
    });
  }

  // --------------------------------------------------------------------------
  // 8. Items del checklist de contratación (plantilla T7A)
  // --------------------------------------------------------------------------
  const checklistLabels: Array<[string, string]> = [
    ['Firma de contrato o acuerdo de prestación', 'CONSULTOR'],
    ['Envío y revisión de documentos legales', 'CONSULTOR'],
    ['Validaciones internas de proveedor (cliente)', 'CLIENTE'],
    ['Documentos tributarios y RUT', 'CONSULTOR'],
    ['Verificación advisory de formalización', 'ADVISORY'],
  ];
  for (const [label, responsible] of checklistLabels) {
    const exists = await prisma.contractChecklistItem.findFirst({ where: { label, caseId: 0 } });
    if (!exists) {
      // Se guardan como plantilla con caseId=0; al activar contratación se copian al caso
      await prisma.contractChecklistItem.create({
        data: { caseId: 0, label, responsible },
      });
    }
  }

  console.log('✅ Seed NODUS completado (idempotente).');
  console.log('   Usuarios demo — password:', PASSWORD);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
