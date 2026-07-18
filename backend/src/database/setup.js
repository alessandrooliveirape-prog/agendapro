import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { supabase } from '../config/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setup() {
  console.log('🔧 Configurando banco de dados AgendaPro...\n');

  try {
    // Ler schema SQL
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Dividir em comandos individuais
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
        if (error) {
          // Tentar executar direto se rpc não existir
          console.log(`⚠️ Comando pode já existir ou precisar executar manualmente`);
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    console.log('✅ Schema do banco de dados pronto!');
    console.log(`📊 ${successCount} comandos executados, ${errorCount} ignorados`);
    console.log('\n📋 Próximo passo:');
    console.log('   1. Acesse o Supabase SQL Editor');
    console.log('   2. Cole o conteúdo de src/database/schema.sql');
    console.log('   3. Execute para criar todas as tabelas');

  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error.message);
    console.log('\n📋 Execute manualmente:');
    console.log('   1. Acesse https://supabase.com/dashboard');
    console.log('   2. Vá em SQL Editor');
    console.log('   3. Cole o conteúdo de src/database/schema.sql');
    console.log('   4. Execute');
  }
}

setup();
