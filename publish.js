const fs = require('fs')

function mkdirAsync (path) {
  return new Promise(function (resolve, reject) {
    fs.mkdir(path, function (error, result) {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

function statAsync (path) {
  return new Promise(function (resolve, reject) {
    fs.stat(path, function (error, result) {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

function readdirAsync (path) {
  return new Promise(function (resolve, reject) {
    fs.readdir(path, function (error, result) {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

function copyFileAsync (source, target) {
  return new Promise(function (resolve, reject) {
    var rd = fs.createReadStream(source)
    rd.on('error', rejectCleanup)
    var wr = fs.createWriteStream(target)
    wr.on('error', rejectCleanup)
    function rejectCleanup (err) {
      rd.destroy()
      wr.end()
      reject(err)
    }
    wr.on('finish', resolve)
    rd.pipe(wr)
  })
}

function readFileAsync (path) {
  return new Promise(function (resolve, reject) {
    fs.readFile(path, function (error, result) {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

function writeFileAsync (path, data) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(path, data, function (error, result) {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

const JS_KEY_REGEX = /main.(.*).js/g
const CSS_KEY_REGEX = /main.(.*).css/g

function getUniqueKey (names, regex) {
  let key = null
  names.forEach(name => {
    const match = regex.exec(name)
    if (match) {
      key = match[1]
    }
  })
  return key
}

async function createDirIfNotExists (dir) {
  let stat = null
  try {
    stat = await statAsync(dir)
  } catch (e1) {
    if (e1.code === 'ENOENT') {
      try {
        await mkdirAsync(dir)
        stat = await statAsync(dir)
      } catch (e2) {
        throw e2
      }
    }
  }
  return stat
}

async function main (publishDir) {
  const jsNames = await readdirAsync('build/static/js')
  const cssNames = await readdirAsync('build/static/css')

  const jsKey = getUniqueKey(jsNames, JS_KEY_REGEX)
  if (!jsKey) {
    throw Error('Unable to find generated js files')
  }

  const cssKey = getUniqueKey(cssNames, CSS_KEY_REGEX)
  if (!cssKey) {
    throw Error('Unable to find generated css files')
  }

  const root = `./${publishDir}`
  createDirIfNotExists(root)
  const staticDir = `${root}/static`
  createDirIfNotExists(staticDir)
  const staticCss = `${staticDir}/css`
  createDirIfNotExists(staticCss)
  const staticJs = `${staticDir}/js`
  createDirIfNotExists(staticJs)

  await writeFileAsync(`${staticCss}/main.css`, (await readFileAsync(`build/static/css/main.${cssKey}.css`)).toString().replace(new RegExp(`.${cssKey}`, 'g'), ''))
  await copyFileAsync(`build/static/css/main.${cssKey}.css.map`, `${staticCss}/main.css.map`)
  await writeFileAsync(`${staticJs}/main.js`, (await readFileAsync(`build/static/js/main.${jsKey}.js`)).toString().replace(new RegExp(`.${jsKey}`, 'g'), ''))
  await copyFileAsync(`build/static/js/main.${jsKey}.js.map`, `${staticJs}/main.js.map`)

  // Remove the unique keys
  await writeFileAsync(`${root}/index.html`, (await readFileAsync('build/index.html')).toString().replace(new RegExp(`.${jsKey}`, 'g'), '').replace(new RegExp(`.${cssKey}`, 'g'), '').replace(new RegExp('/static', 'g'), 'static'))
}

main(process.argv[2])
