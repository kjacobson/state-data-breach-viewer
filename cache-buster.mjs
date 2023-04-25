import fs from 'fs'
import path from 'path'
import md5 from 'md5'
import STATIC_FILES from './static-files.json' assert { type: "json" }

const STATIC_DIR = "public"
const BUILD_DIR = "public"

const hashFile = (loc) => {
  return new Promise((resolve, reject) => {
    fs.readFile(loc, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(md5(data))
      }
    })
  })
}

const filePath = (dirPath, filename, ext, hash) => {
  const name = `${filename}${hash ? `!${hash}` : ''}.${ext}`
  console.log("Resolving path for " + name)
  return path.resolve(dirPath, name)
}

const processFile = (loc) => {
  const { name: filename, hash: oldHash, ext } = STATIC_FILES[loc]
  const staticPath = filePath(STATIC_DIR, filename, ext)
  console.log("Processing file at " + staticPath)

  return new Promise((resolve, reject) => {
    hashFile(staticPath).then((hash) => {
      console.log("Old hash: " + oldHash)
      console.log("New hash: " + hash)
      if (oldHash !== hash) {
        STATIC_FILES[loc].hash = hash
        replaceFile(filename, ext, oldHash, hash).then(resolve)
      } else {
        console.info("Nothing changed in file " + loc)
        resolve()
      }
    }, (error) => {
      console.error("Error hashing file " + loc)
      console.error(error)
    })
  })
}

const replaceFile = (filename, ext, oldHash, newHash) => {
  const sourceFilePath = filePath(STATIC_DIR, filename, ext)
  const newFilePath = filePath(BUILD_DIR, filename, ext, newHash)
  const oldFilePath = filePath(BUILD_DIR, filename, ext, oldHash)
  console.log("Source file path: " + sourceFilePath)
  console.log("Old file path: " + oldFilePath)
  console.log("New file path: " + newFilePath)

  const lastSlash = newFilePath.lastIndexOf('/')

  return new Promise((resolve, reject) => {
    const newFileDir = newFilePath.substring(0, lastSlash)
    console.log("Writing to " + newFileDir)
    copyFile(sourceFilePath, newFilePath).then(() => {
      return fs.unlink(oldFilePath, (err) => {
        if (err) {
          console.error("Unable to delete file at " + oldFilePath)
          return
        }

        console.log("Successfully deleted file at " + oldFilePath)
        resolve()
      })
    })
  })
}


const copyFile = (sourceFilePath, newFilePath) => {
  return new Promise((resolve, reject) => {
    fs.copyFile(sourceFilePath, newFilePath, (error) => {
      if (error) {
        console.warn("Error renaming file " + sourceFilePath)
        reject()
      } else {
        console.log("File " + sourceFilePath + " successfully copied to " + newFilePath)
        resolve()
      }
    })
  })
}

Promise.all(
  Object.keys(STATIC_FILES).map(processFile)
).then(() => {
  fs.writeFile('./static-files.json', JSON.stringify(STATIC_FILES, null, 2), (err) => {
    if (err) {
      console.error("Error writing to static file manifest")
    } else {
      console.info("Successfully hashed static files")
    }
  })
})
