const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
module.exports = function createLoader(dataDir) {
  const cache = new Map()
  const root = process.cwd()
  function load(file) {
    const full = path.resolve(root, file.endsWith('.ts') ? file : file + '.ts')
    if (cache.has(full)) return cache.get(full)
    const exports = {}
    cache.set(full, exports)
    const source = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText
    vm.runInNewContext(source, {
      exports, console,
      process: { cwd: () => root, env: { ...process.env, RELIEF_DATA_DIR: dataDir } },
      require: name => name.startsWith('@/') ? load(path.join(root, name.slice(2)))
        : name.startsWith('.') ? load(path.resolve(path.dirname(full), name)) : require(name),
    }, { filename: full })
    return exports
  }
  return load
}
