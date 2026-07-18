// Database mock for development without Supabase
// In production, replace with real Supabase client

const useMock = !process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('seu-projeto');

// In-memory storage for mock mode
const mockData = {
  businesses: [],
  users: [],
  services: [],
  professionals: [],
  clients: [],
  appointments: [],
  time_blocks: [],
};

let supabaseInstance;

async function initDatabase() {
  if (useMock) {
    supabaseInstance = createMockClient();
  } else {
    supabaseInstance = await createRealClient();
  }
  return supabaseInstance;
}

export const supabase = useMock ? createMockClient() : await initDatabase();

async function createRealClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const ws = await import('ws');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    realtime: { transport: ws.default || ws },
  });
}

function createMockClient() {
  console.log('⚠️ Modo Mock: Usando banco em memória (dados não persistem)');

  return {
    from: (table) => new MockQuery(table),
    rpc: async () => ({ data: null, error: null }),
  };
}

class MockQuery {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.selectFields = '*';
    this.orderBy = null;
    this.limitCount = null;
    this.isSingle = false;
  }

  select(fields = '*', options = {}) {
    this.selectFields = fields;
    if (options.head) this.isHead = true;
    if (options.count === 'exact') this.isCount = true;
    return this;
  }

  eq(field, value) {
    this.filters.push({ type: 'eq', field, value });
    return this;
  }

  neq(field, value) {
    this.filters.push({ type: 'neq', field, value });
    return this;
  }

  gt(field, value) {
    this.filters.push({ type: 'gt', field, value });
    return this;
  }

  gte(field, value) {
    this.filters.push({ type: 'gte', field, value });
    return this;
  }

  lt(field, value) {
    this.filters.push({ type: 'lt', field, value });
    return this;
  }

  lte(field, value) {
    this.filters.push({ type: 'lte', field, value });
    return this;
  }

  ilike(field, pattern) {
    this.filters.push({ type: 'ilike', field, pattern });
    return this;
  }

  or(conditions) {
    this.filters.push({ type: 'or', conditions });
    return this;
  }

  order(field, options = {}) {
    this.orderBy = { field, ascending: options.ascending !== false };
    return this;
  }

  limit(count) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async insert(data) {
    const items = Array.isArray(data) ? data : [data];
    const inserted = items.map(item => ({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...item,
    }));
    mockData[this.table] = [...(mockData[this.table] || []), ...inserted];
    return { data: this.isSingle ? inserted[0] : inserted, error: null };
  }

  async update(data) {
    const table = mockData[this.table] || [];
    const updated = [];
    for (let i = 0; i < table.length; i++) {
      if (this.matchFilters(table[i])) {
        table[i] = { ...table[i], ...data, updated_at: new Date().toISOString() };
        updated.push(table[i]);
      }
    }
    mockData[this.table] = table;
    return { data: this.isSingle ? updated[0] : updated, error: null };
  }

  async delete() {
    const table = mockData[this.table] || [];
    mockData[this.table] = table.filter(item => !this.matchFilters(item));
    return { data: null, error: null };
  }

  matchFilters(item) {
    return this.filters.every(filter => {
      if (filter.type === 'eq') return item[filter.field] === filter.value;
      if (filter.type === 'neq') return item[filter.field] !== filter.value;
      if (filter.type === 'gt') return item[filter.field] > filter.value;
      if (filter.type === 'gte') return item[filter.field] >= filter.value;
      if (filter.type === 'lt') return item[filter.field] < filter.value;
      if (filter.type === 'lte') return item[filter.field] <= filter.value;
      if (filter.type === 'ilike') {
        const regex = new RegExp(filter.pattern.replace(/%/g, '.*'), 'i');
        return regex.test(item[filter.field]);
      }
      return true;
    });
  }

  then(resolve) {
    const table = mockData[this.table] || [];
    let results = table.filter(item => this.matchFilters(item));

    if (this.orderBy) {
      results.sort((a, b) => {
        const aVal = a[this.orderBy.field];
        const bVal = b[this.orderBy.field];
        return this.orderBy.ascending ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
    }

    if (this.limitCount) {
      results = results.slice(0, this.limitCount);
    }

    if (this.isCount) {
      return resolve({ data: null, count: results.length, error: null });
    }

    if (this.isSingle) {
      return resolve({ data: results[0] || null, error: results[0] ? null : { message: 'Not found' } });
    }

    return resolve({ data: results, error: null });
  }
}

// Seed some demo data
if (useMock) {
  const demoBusiness = {
    id: 'demo-business-id',
    name: 'Barbearia do Zé',
    slug: 'barbearia-do-ze',
    owner_email: 'ze@barbearia.com',
    phone: '(11) 99999-9999',
    address: 'Rua das Flores, 123 - São Paulo, SP',
    description: 'A melhor barbearia da região',
    subscription_plan: 'pro',
    whatsapp_enabled: true,
    working_hours: {
      monday: { start: '09:00', end: '18:00', active: true },
      tuesday: { start: '09:00', end: '18:00', active: true },
      wednesday: { start: '09:00', end: '18:00', active: true },
      thursday: { start: '09:00', end: '18:00', active: true },
      friday: { start: '09:00', end: '18:00', active: true },
      saturday: { start: '09:00', end: '14:00', active: true },
      sunday: { start: '00:00', end: '00:00', active: false },
    },
  };

  mockData.businesses.push(demoBusiness);

  // Demo user - senha: 123456
  mockData.users.push({
    id: 'demo-user-id',
    business_id: 'demo-business-id',
    name: 'José da Silva',
    email: 'ze@barbearia.com',
    password_hash: '123456', // Mock mode: aceita senha direta
    role: 'owner',
  });

  mockData.services.push(
    { id: crypto.randomUUID(), business_id: 'demo-business-id', name: 'Corte masculino', duration_minutes: 30, price: 45, color: '#6366f1', is_active: true },
    { id: crypto.randomUUID(), business_id: 'demo-business-id', name: 'Barba', duration_minutes: 20, price: 30, color: '#8b5cf6', is_active: true },
    { id: crypto.randomUUID(), business_id: 'demo-business-id', name: 'Corte + Barba', duration_minutes: 45, price: 65, color: '#a855f7', is_active: true },
    { id: crypto.randomUUID(), business_id: 'demo-business-id', name: 'Degradê', duration_minutes: 40, price: 55, color: '#ec4899', is_active: true },
  );

  mockData.professionals.push({
    id: 'demo-professional-id',
    business_id: 'demo-business-id',
    name: 'Zé',
    email: 'ze@barbearia.com',
    phone: '(11) 99999-9999',
    is_active: true,
  });

  console.log('✅ Dados de teste carregados!');
  console.log('📋 Login: ze@barbearia.com / 123456');
}
