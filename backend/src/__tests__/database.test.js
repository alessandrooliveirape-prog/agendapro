import { describe, it, expect } from 'vitest';
import './helper.js';
import { supabase } from '../config/database.js';

describe('Mock database', () => {
  describe('Query builder', () => {
    it('select all from a table', async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*');

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('filter with eq', async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', 'demo-business-id');

      expect(data.every(s => s.business_id === 'demo-business-id')).toBe(true);
    });

    it('filter with neq', async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .neq('name', 'Barba');

      expect(data.every(s => s.name !== 'Barba')).toBe(true);
    });

    it('single() returns one record', async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', 'demo-business-id')
        .single();

      expect(error).toBeNull();
      expect(data.id).toBe('demo-business-id');
    });

    it('single() returns error when not found', async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', 'nonexistent')
        .single();

      expect(data).toBeNull();
      expect(error).toBeTruthy();
    });

    it('insert adds a record', async () => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          business_id: 'demo-business-id',
          name: 'Test Client',
          phone: '11999999999',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.name).toBe('Test Client');
      expect(data.id).toBeDefined();
    });

    it('update modifies a record', async () => {
      // Insert first
      const { data: inserted } = await supabase
        .from('clients')
        .insert({
          business_id: 'demo-business-id',
          name: 'ToUpdate',
          phone: '11888888888',
        })
        .select()
        .single();

      const { data: updated, error } = await supabase
        .from('clients')
        .update({ name: 'Updated' })
        .eq('id', inserted.id)
        .select()
        .single();

      expect(error).toBeNull();
      expect(updated.name).toBe('Updated');
    });

    it('delete removes records', async () => {
      // Insert first
      const { data: inserted } = await supabase
        .from('clients')
        .insert({
          business_id: 'demo-business-id',
          name: 'ToDelete',
          phone: '11777777777',
        })
        .select()
        .single();

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', inserted.id);

      expect(error).toBeNull();

      // Verify deleted
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', inserted.id)
        .single();

      expect(data).toBeNull();
    });

    it('order() sorts results', async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .order('price', { ascending: true });

      for (let i = 1; i < data.length; i++) {
        expect(data[i].price).toBeGreaterThanOrEqual(data[i - 1].price);
      }
    });

    it('limit() restricts results', async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .limit(2);

      expect(data.length).toBeLessThanOrEqual(2);
    });

    it('or() filter works correctly', async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .or('name.eq.Corte masculino,name.eq.Barba');

      expect(data.length).toBe(2);
      expect(data.some(s => s.name === 'Corte masculino')).toBe(true);
      expect(data.some(s => s.name === 'Barba')).toBe(true);
    });

    it('ilike filter works', async () => {
      const { data } = await supabase
        .from('services')
        .select('*')
        .ilike('name', '%corte%');

      expect(data.length).toBeGreaterThan(0);
      expect(data.every(s => s.name.toLowerCase().includes('corte'))).toBe(true);
    });

    it('count with head: true', async () => {
      const { count, error } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });

      expect(error).toBeNull();
      expect(count).toBeGreaterThan(0);
    });
  });
});
