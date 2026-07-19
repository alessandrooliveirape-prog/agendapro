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
    this.isHead = false;
    this.isCount = false;
    this._operation = null; // 'select' | 'insert' | 'update' | 'delete'
    this._operationData = null;
  }

  select(fields = '*', options = {}) {
    this.selectFields = fields;
    if (options.head) this.isHead = true;
    if (options.count === 'exact') this.isCount = true;
    this._operation = this._operation || 'select';
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

  insert(data) {
    this._operation = 'insert';
    this._operationData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this._operation = 'update';
    this._operationData = data;
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
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
        const escaped = filter.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
        const regex = new RegExp(`^${escaped}$`, 'i');
        return regex.test(item[filter.field]);
      }
      if (filter.type === 'or') {
        const conditions = filter.conditions.split(',');
        return conditions.some(cond => {
          const match = cond.match(/^(\w+)\.(\w+)\.(.+)$/);
          if (!match) return false;
          const [, field, op, value] = match;
          const fieldValue = item[field];
          if (op === 'eq') return fieldValue === value;
          if (op === 'neq') return fieldValue !== value;
          if (op === 'gt') return fieldValue > value;
          if (op === 'gte') return fieldValue >= value;
          if (op === 'lt') return fieldValue < value;
          if (op === 'lte') return fieldValue <= value;
          if (op === 'ilike') {
            const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*');
            const regex = new RegExp(`^${escaped}$`, 'i');
            return regex.test(fieldValue);
          }
          return true;
        });
      }
      return true;
    });
  }

  _resolveJoins(results) {
    if (this.selectFields && this.selectFields !== '*') {
      const joinPattern = /(\w+)\(([^)]+)\)/g;
      let match;
      while ((match = joinPattern.exec(this.selectFields)) !== null) {
        const [, joinTable, joinFields] = match;
        const foreignKey = `${joinTable.replace(/s$/, '')}_id`;
        const relatedData = mockData[joinTable] || [];
        results = results.map(item => {
          const fk = item[foreignKey];
          const related = relatedData.find(r => r.id === fk);
          if (related) {
            const fields = joinFields.split(',').map(f => f.trim());
            const projected = {};
            fields.forEach(f => { projected[f] = related[f]; });
            return { ...item, [joinTable]: projected };
          }
          return { ...item, [joinTable]: null };
        });
      }
    }
    return results;
  }

  then(resolve) {
    if (this._operation === 'insert') {
      const items = this._operationData.map(item => ({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...item,
      }));
      mockData[this.table] = [...(mockData[this.table] || []), ...items];
      const result = { data: this.isSingle ? items[0] : items, error: null };
      return resolve(result);
    }

    if (this._operation === 'update') {
      const table = mockData[this.table] || [];
      const updated = [];
      for (let i = 0; i < table.length; i++) {
        if (this.matchFilters(table[i])) {
          table[i] = { ...table[i], ...this._operationData, updated_at: new Date().toISOString() };
          updated.push(table[i]);
        }
      }
      mockData[this.table] = table;
      const result = { data: this.isSingle ? updated[0] : updated, error: null };
      return resolve(result);
    }

    if (this._operation === 'delete') {
      const table = mockData[this.table] || [];
      mockData[this.table] = table.filter(item => !this.matchFilters(item));
      return resolve({ data: null, error: null });
    }

    // Default: select
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

    results = this._resolveJoins(results);

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

  // Demo user - senha: 123456 (pre-hashed with bcrypt)
  const bcryptHash = '$2a$10$YQ8GvPvJvQZkfR1qXvMz3OZKqJjCkF5sLxNvBqH5mN7tR8uP2kW4a';
  mockData.users.push({
    id: 'demo-user-id',
    business_id: 'demo-business-id',
    name: 'José da Silva',
    email: 'ze@barbearia.com',
    password_hash: '$2a$10$OKxxy7sQkKlAs9qydyLxi.gA9gEgqWB3/Hkazh19cW6GEFN68eHVu',
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
