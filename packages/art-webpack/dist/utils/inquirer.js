"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configWebpackModules_1 = require("../config/configWebpackModules");
const chalkColors_1 = require("art-dev-utils/lib/chalkColors");
const json_colorz_1 = __importDefault(require("json-colorz"));
const inquirer_1 = __importDefault(require("inquirer"));
exports.confirmModules = (callback) => {
    const availableModules = configWebpackModules_1.webpackEntries(false);
    const moduleKeys = Object.keys(availableModules);
    const modulesCount = moduleKeys.length;
    if (!modulesCount) {
        console.log(chalkColors_1.cyanBoldText('No available modules here, please check `--modules`!'));
        return;
    }
    for (let i = 0; i < modulesCount; i++) {
        availableModules[moduleKeys[i]][0] = 'polyfills';
    }
    json_colorz_1.default(availableModules);
    inquirer_1.default.prompt({
        type: 'confirm',
        name: 'availableModulesOk',
        message: 'Please confirm above modules you could like?'
    }).then((answer) => {
        const availableModulesOk = answer.availableModulesOk;
        callback({
            availableModulesOk,
            moduleEntryKeys: Object.keys(availableModules)
        });
    });
};
