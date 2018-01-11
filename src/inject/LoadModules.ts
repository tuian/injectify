import { Module } from './definitions/module'
const fs = require('fs')
const yaml = require('node-yaml')
const chalk = require('chalk')
const UglifyJS = require('uglify-es')

export default class {
  state = {
    modules: <any> {},
    debugModules: <any> {},
    count: <number> 0
  }

  constructor() {

  }

  get load() {
    return new Promise<{ modules: any, debugModules: any, count: number }>((resolve, reject) => {
      fs.readdir(`${__dirname}/modules/`, (err, folders) => {
        if (!err) {
          folders.forEach((folder: string, index: number, array: string[]) => {
            let yml = <Module.yml> {}
            let js: string
            let error = false
            try {
              js = fs.readFileSync(`${__dirname}/modules/` + folder + '/module.js', 'utf8')
              yml = yaml.parse(fs.readFileSync(`${__dirname}/modules/` + folder + '/module.yml', 'utf8'))
            } catch (error) {
              if (js && !yml.name) {
                // Attempt to load module in basic mode
                console.warn(
                  chalk.yellowBright('[inject:module] ') +
                  chalk.yellowBright('missing configuration for ') +
                  chalk.magentaBright('./' + folder + '/') +
                  chalk.yellowBright(', it may misbehave')
                )
                yml.name = folder
              } else {
                error = true
                console.error(
                  chalk.redBright('[inject:module] ') +
                  chalk.yellowBright('failed to load module ') +
                  chalk.magentaBright('./' + folder + '/')
                )
              }
            }
            if (!error) {
              let unminified = js
              let minified = UglifyJS.minify(js).code
              if (minified && yml.minify !== false) js = minified
              if (typeof yml.name === 'object') {
                for (var i in yml.name) {
                  this.state.modules[yml.name[i]] = js
                  this.state.debugModules[yml.name[i]] = unminified
                }
              } else {
                this.state.modules[yml.name] = js
                this.state.debugModules[yml.name] = unminified
              }
              this.state.count++
            }
            if (folders.length - 1 === index) resolve(this.state)
          })
        } else {
          reject({
            title: 'Failed to load modules!',
            error: err
          })
        }
      })
    })
  }
}
