import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSchema } from './schema.mjs';
import { UnavailableError } from './provider.mjs';

/** Auth stays with the installed CLI. No auth file or token enters application data. */
export function createCodexProvider(config, env = process.env) {
  let active = 0;
  return {
    model: config.model,
    async generate({ schema, instructions, input }) {
      if (active >= config.max_concurrent_processes) throw new UnavailableError('The model service is busy. Try again shortly.');
      active++;
      let directory;
      try {
        directory = await mkdtemp(join(tmpdir(), 'chizu-codex-'));
        const schemaPath = join(directory, 'schema.json');
        const outputPath = join(directory, 'result.json');
        await writeFile(schemaPath, JSON.stringify(schema), { mode: 0o600 });
        const args = ['exec', '--ignore-user-config', '--skip-git-repo-check', '--ephemeral', '--sandbox', 'read-only',
          '--model', config.model, '--json', '--color', 'never', '--output-schema', schemaPath, '--output-last-message', outputPath,
          '-c', 'approval_policy="never"', '-c', 'project_doc_max_bytes=0', '-c', 'web_search="disabled"',
          '-c', `model_reasoning_effort=${JSON.stringify(config.reasoning_effort)}`,
          '--enable', 'skip_host_skill_discovery'];
        for (const feature of ['apps', 'plugins', 'hooks', 'shell_tool', 'unified_exec', 'multi_agent', 'browser_use', 'computer_use', 'image_generation', 'view_image', 'memories', 'skill_search']) args.push('--disable', feature);
        args.push('-');
        await new Promise((resolve, reject) => {
          const child = spawn(env.CHIZU_CODEX_BIN || 'codex', args, { cwd: directory, env, stdio: ['pipe', 'pipe', 'pipe'] });
          let diagnostic = '', bytes = 0, timedOut = false;
          const timeout = setTimeout(() => { timedOut = true; child.kill('SIGTERM'); }, config.timeout_ms);
          child.on('error', error => { clearTimeout(timeout); reject(new UnavailableError(`Codex CLI could not start: ${error.code || 'unknown error'}.`)); });
          child.stdout.on('data', data => {
            bytes += data.length;
            if (bytes > 2000000) child.kill('SIGTERM');
          });
          child.stderr.on('data', data => { diagnostic = (diagnostic + data.toString()).slice(-2000); });
          child.on('close', code => {
            clearTimeout(timeout);
            if (timedOut) reject(new UnavailableError('Codex CLI timed out.'));
            else if (code !== 0) {
              // Details remain on the server; never send them to the browser.
              console.error('Codex CLI failed:', diagnostic);
              reject(new UnavailableError(`Codex CLI exited with code ${code}.`));
            } else resolve();
          });
          child.stdin.on('error', () => {});
          child.stdin.end(`You are a text-only Japanese curriculum service. Use only the task data below. Do not call tools, inspect files, browse, edit files, or invoke other agents. Return only the required JSON.\n\n${instructions}\n\nTASK DATA:\n${JSON.stringify(input)}`);
        });
        const result = JSON.parse(await readFile(outputPath, 'utf8'));
        validateSchema(result, schema);
        return result;
      } finally {
        active--;
        if (directory) await rm(directory, { recursive: true, force: true });
      }
    },
  };
}
