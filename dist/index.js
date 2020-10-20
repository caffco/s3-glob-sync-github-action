require('./sourcemap-register.js');module.exports =
/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 29278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getChunked = void 0;
exports.getChunked = (originalItems, maximumChunkSize) => {
    if (maximumChunkSize <= 0 || isNaN(maximumChunkSize)) {
        throw new Error('Chunk size must be a positive number');
    }
    if (!originalItems.length) {
        return [];
    }
    return originalItems.reduce((chunks, item) => {
        const lastChunk = chunks[chunks.length - 1];
        const isLastChunkFilled = lastChunk.length >= maximumChunkSize;
        return isLastChunkFilled
            ? [...chunks, [item]]
            : [...chunks.slice(0, -1), [...lastChunk, item]];
    }, [[]]);
};


/***/ }),

/***/ 95933:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadPrefix = void 0;
const path_1 = __webpack_require__(85622);
const fs_1 = __importDefault(__webpack_require__(35747));
const mkdirp_1 = __importDefault(__webpack_require__(66186));
const downloadSingleFile = ({ destinationFolder, key, bucketName, prefix, s3 }) => __awaiter(void 0, void 0, void 0, function* () {
    const absolutePathToFile = path_1.resolve(destinationFolder, key.substring(prefix.length));
    mkdirp_1.default.sync(path_1.dirname(absolutePathToFile));
    const remoteObject = yield s3.getObject({
        Bucket: bucketName,
        Key: key
    });
    const readStream = remoteObject.Body;
    if (!readStream) {
        throw new Error(`Attempt to fetch object with key «${key}» on bucket «${bucketName}» returned invalid empty body: «${readStream}»`);
    }
    const writeStream = fs_1.default.createWriteStream(absolutePathToFile);
    return new Promise((resolve, reject) => {
        readStream.on('error', error => writeStream.emit('error', error));
        writeStream.on('error', reject);
        writeStream.on('finish', () => resolve(absolutePathToFile));
        readStream.pipe(writeStream);
    });
});
const downloadObjects = ({ objectsInBucket, destinationFolder, bucketName, prefix, s3 }) => __awaiter(void 0, void 0, void 0, function* () {
    return Promise.all(objectsInBucket.map((singleObjectInBucket) => __awaiter(void 0, void 0, void 0, function* () {
        if (!singleObjectInBucket.Key) {
            throw new Error(`No key for remote object: ${JSON.stringify(singleObjectInBucket)}`);
        }
        return downloadSingleFile({
            destinationFolder,
            key: singleObjectInBucket.Key,
            bucketName,
            prefix,
            s3
        });
    })));
});
const downloadObjectsWithPrefixInPage = ({ continuationToken, destinationFolder, bucketName, prefix, s3, maxParallelDownloads }) => __awaiter(void 0, void 0, void 0, function* () {
    const { Contents: objectsInBucket, NextContinuationToken: nextContinuationToken, IsTruncated: hasNextPage } = yield s3.listObjectsV2({
        ContinuationToken: continuationToken,
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: maxParallelDownloads
    });
    if (!objectsInBucket) {
        throw new Error(`No objects with prefix «${prefix}» found in bucket «${bucketName}»`);
    }
    const absolutePathsToDownloadedFiles = yield downloadObjects({
        objectsInBucket,
        destinationFolder,
        bucketName,
        prefix,
        s3
    });
    if (hasNextPage) {
        if (!nextContinuationToken) {
            throw new Error('Response has next page but no continuation token was provided');
        }
        return {
            hasNextPage: true,
            nextContinuationToken,
            absolutePathsToDownloadedFiles
        };
    }
    return {
        hasNextPage: false,
        nextContinuationToken: undefined,
        absolutePathsToDownloadedFiles
    };
});
exports.downloadPrefix = ({ destinationFolder, bucketName, prefix, s3, maxParallelDownloads }) => __awaiter(void 0, void 0, void 0, function* () {
    const absolutePathsToDownloadedFiles = [];
    let continuationToken = undefined;
    do {
        const currentPageResult = yield downloadObjectsWithPrefixInPage({
            continuationToken,
            destinationFolder,
            bucketName,
            prefix,
            s3,
            maxParallelDownloads
        });
        continuationToken = currentPageResult.nextContinuationToken;
        absolutePathsToDownloadedFiles.push(...currentPageResult.absolutePathsToDownloadedFiles);
    } while (continuationToken);
    return absolutePathsToDownloadedFiles;
});


/***/ }),

/***/ 85928:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.setGithubActionOutputFromResults = exports.getOptionsFromGithubActionInput = void 0;
const core_1 = __webpack_require__(42186);
const getS3BucketConfig = () => ({
    prefix: core_1.getInput('prefix'),
    bucketName: core_1.getInput('bucket_name'),
    endpoint: core_1.getInput('endpoint'),
    region: core_1.getInput('region'),
    credentials: {
        accessKeyId: core_1.getInput('access_key_id'),
        secretAccessKey: core_1.getInput('secret_access_key')
    }
});
function getOptionsFromGithubActionInput() {
    const mode = core_1.getInput('mode');
    const s3BucketConfig = getS3BucketConfig();
    switch (mode) {
        case 'upload':
            return Object.assign(Object.assign({}, s3BucketConfig), { mode, acl: core_1.getInput('acl') || 'private', patterns: core_1.getInput('patterns').split('\n'), maxParallelUploads: parseInt(core_1.getInput('max_parallel_uploads')) || 10 });
        case 'download':
            return Object.assign(Object.assign({}, s3BucketConfig), { mode, destinationFolder: core_1.getInput('destination_folder'), maxParallelDownloads: parseInt(core_1.getInput('max_parallel_downloads')) || 10 });
    }
}
exports.getOptionsFromGithubActionInput = getOptionsFromGithubActionInput;
function setGithubActionOutputFromResults({ mode, absolutePathToFiles }) {
    switch (mode) {
        case 'upload':
            core_1.setOutput('uploaded_files', absolutePathToFiles);
            break;
        case 'download':
            core_1.setOutput('downloaded_files', absolutePathToFiles);
            break;
    }
}
exports.setGithubActionOutputFromResults = setGithubActionOutputFromResults;


/***/ }),

/***/ 94822:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core = __importStar(__webpack_require__(42186));
const main_1 = __importDefault(__webpack_require__(3109));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield main_1.default();
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();


/***/ }),

/***/ 3109:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const client_s3_node_1 = __webpack_require__(39960);
const github_1 = __webpack_require__(85928);
const upload_1 = __webpack_require__(64831);
const download_1 = __webpack_require__(95933);
const run = ({ mode, options, action }) => __awaiter(void 0, void 0, void 0, function* () {
    const absolutePathToFiles = yield action(options);
    github_1.setGithubActionOutputFromResults({
        mode,
        absolutePathToFiles
    });
});
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const options = github_1.getOptionsFromGithubActionInput();
        const s3 = new client_s3_node_1.S3({
            endpoint: options.endpoint,
            region: options.region,
            credentials: {
                accessKeyId: options.credentials.accessKeyId,
                secretAccessKey: options.credentials.secretAccessKey
            }
        });
        switch (options.mode) {
            case 'upload':
                yield run({
                    mode: options.mode,
                    options: Object.assign(Object.assign({}, options), { s3 }),
                    action: upload_1.uploadGlobToPrefix
                });
                break;
            case 'download':
                yield run({
                    mode: options.mode,
                    options: Object.assign(Object.assign({}, options), { s3 }),
                    action: download_1.downloadPrefix
                });
                break;
        }
    });
}
exports.default = main;


/***/ }),

/***/ 64831:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadGlobToPrefix = void 0;
const fs_1 = __importDefault(__webpack_require__(35747));
const glob = __importStar(__webpack_require__(28090));
const chunk_1 = __webpack_require__(29278);
const uploadSingleFile = ({ acl, absolutePathToFile, bucketName, prefix, s3 }) => __awaiter(void 0, void 0, void 0, function* () {
    const buffer = yield new Promise((resolve, reject) => fs_1.default.readFile(absolutePathToFile, (error, data) => error ? reject(error) : resolve(data)));
    yield s3.putObject({
        Bucket: bucketName,
        Key: `${prefix}${absolutePathToFile}`,
        Body: buffer,
        ACL: acl
    });
});
exports.uploadGlobToPrefix = ({ acl, patterns, bucketName, prefix, s3, maxParallelUploads }) => __awaiter(void 0, void 0, void 0, function* () {
    const globber = yield glob.create(patterns.join('\n'));
    const absolutePathsToUpload = yield globber.glob();
    const chunks = chunk_1.getChunked(absolutePathsToUpload, maxParallelUploads);
    for (const singleChunk of chunks) {
        yield Promise.all(singleChunk.map((absolutePathToFile) => __awaiter(void 0, void 0, void 0, function* () {
            return yield uploadSingleFile({
                acl,
                absolutePathToFile,
                bucketName,
                prefix,
                s3
            });
        })));
    }
    return absolutePathsToUpload;
});


/***/ }),

/***/ 87351:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const os = __importStar(__webpack_require__(12087));
const utils_1 = __webpack_require__(5278);
/**
 * Commands
 *
 * Command Format:
 *   ::name key=value,key=value::message
 *
 * Examples:
 *   ::warning::This is the message
 *   ::set-env name=MY_VAR::some value
 */
function issueCommand(command, properties, message) {
    const cmd = new Command(command, properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}
exports.issueCommand = issueCommand;
function issue(name, message = '') {
    issueCommand(name, {}, message);
}
exports.issue = issue;
const CMD_STRING = '::';
class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = CMD_STRING + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${escapeProperty(val)}`;
                    }
                }
            }
        }
        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
        return cmdStr;
    }
}
function escapeData(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A');
}
function escapeProperty(s) {
    return utils_1.toCommandValue(s)
        .replace(/%/g, '%25')
        .replace(/\r/g, '%0D')
        .replace(/\n/g, '%0A')
        .replace(/:/g, '%3A')
        .replace(/,/g, '%2C');
}
//# sourceMappingURL=command.js.map

/***/ }),

/***/ 42186:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const command_1 = __webpack_require__(87351);
const file_command_1 = __webpack_require__(717);
const utils_1 = __webpack_require__(5278);
const os = __importStar(__webpack_require__(12087));
const path = __importStar(__webpack_require__(85622));
/**
 * The code to exit an action
 */
var ExitCode;
(function (ExitCode) {
    /**
     * A code indicating that the action was successful
     */
    ExitCode[ExitCode["Success"] = 0] = "Success";
    /**
     * A code indicating that the action was a failure
     */
    ExitCode[ExitCode["Failure"] = 1] = "Failure";
})(ExitCode = exports.ExitCode || (exports.ExitCode = {}));
//-----------------------------------------------------------------------
// Variables
//-----------------------------------------------------------------------
/**
 * Sets env variable for this action and future actions in the job
 * @param name the name of the variable to set
 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function exportVariable(name, val) {
    const convertedVal = utils_1.toCommandValue(val);
    process.env[name] = convertedVal;
    const filePath = process.env['GITHUB_ENV'] || '';
    if (filePath) {
        const delimiter = '_GitHubActionsFileCommandDelimeter_';
        const commandValue = `${name}<<${delimiter}${os.EOL}${convertedVal}${os.EOL}${delimiter}`;
        file_command_1.issueCommand('ENV', commandValue);
    }
    else {
        command_1.issueCommand('set-env', { name }, convertedVal);
    }
}
exports.exportVariable = exportVariable;
/**
 * Registers a secret which will get masked from logs
 * @param secret value of the secret
 */
function setSecret(secret) {
    command_1.issueCommand('add-mask', {}, secret);
}
exports.setSecret = setSecret;
/**
 * Prepends inputPath to the PATH (for this action and future actions)
 * @param inputPath
 */
function addPath(inputPath) {
    const filePath = process.env['GITHUB_PATH'] || '';
    if (filePath) {
        file_command_1.issueCommand('PATH', inputPath);
    }
    else {
        command_1.issueCommand('add-path', {}, inputPath);
    }
    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
}
exports.addPath = addPath;
/**
 * Gets the value of an input.  The value is also trimmed.
 *
 * @param     name     name of the input to get
 * @param     options  optional. See InputOptions.
 * @returns   string
 */
function getInput(name, options) {
    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
    if (options && options.required && !val) {
        throw new Error(`Input required and not supplied: ${name}`);
    }
    return val.trim();
}
exports.getInput = getInput;
/**
 * Sets the value of an output.
 *
 * @param     name     name of the output to set
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setOutput(name, value) {
    command_1.issueCommand('set-output', { name }, value);
}
exports.setOutput = setOutput;
/**
 * Enables or disables the echoing of commands into stdout for the rest of the step.
 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
 *
 */
function setCommandEcho(enabled) {
    command_1.issue('echo', enabled ? 'on' : 'off');
}
exports.setCommandEcho = setCommandEcho;
//-----------------------------------------------------------------------
// Results
//-----------------------------------------------------------------------
/**
 * Sets the action status to failed.
 * When the action exits it will be with an exit code of 1
 * @param message add error issue message
 */
function setFailed(message) {
    process.exitCode = ExitCode.Failure;
    error(message);
}
exports.setFailed = setFailed;
//-----------------------------------------------------------------------
// Logging Commands
//-----------------------------------------------------------------------
/**
 * Gets whether Actions Step Debug is on or not
 */
function isDebug() {
    return process.env['RUNNER_DEBUG'] === '1';
}
exports.isDebug = isDebug;
/**
 * Writes debug message to user log
 * @param message debug message
 */
function debug(message) {
    command_1.issueCommand('debug', {}, message);
}
exports.debug = debug;
/**
 * Adds an error issue
 * @param message error issue message. Errors will be converted to string via toString()
 */
function error(message) {
    command_1.issue('error', message instanceof Error ? message.toString() : message);
}
exports.error = error;
/**
 * Adds an warning issue
 * @param message warning issue message. Errors will be converted to string via toString()
 */
function warning(message) {
    command_1.issue('warning', message instanceof Error ? message.toString() : message);
}
exports.warning = warning;
/**
 * Writes info to log with console.log.
 * @param message info message
 */
function info(message) {
    process.stdout.write(message + os.EOL);
}
exports.info = info;
/**
 * Begin an output group.
 *
 * Output until the next `groupEnd` will be foldable in this group
 *
 * @param name The name of the output group
 */
function startGroup(name) {
    command_1.issue('group', name);
}
exports.startGroup = startGroup;
/**
 * End an output group.
 */
function endGroup() {
    command_1.issue('endgroup');
}
exports.endGroup = endGroup;
/**
 * Wrap an asynchronous function call in a group.
 *
 * Returns the same type as the function itself.
 *
 * @param name The name of the group
 * @param fn The function to wrap in the group
 */
function group(name, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        startGroup(name);
        let result;
        try {
            result = yield fn();
        }
        finally {
            endGroup();
        }
        return result;
    });
}
exports.group = group;
//-----------------------------------------------------------------------
// Wrapper action state
//-----------------------------------------------------------------------
/**
 * Saves state for current action, the state can only be retrieved by this action's post job execution.
 *
 * @param     name     name of the state to store
 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function saveState(name, value) {
    command_1.issueCommand('save-state', { name }, value);
}
exports.saveState = saveState;
/**
 * Gets the value of an state set by this action's main execution.
 *
 * @param     name     name of the state to get
 * @returns   string
 */
function getState(name) {
    return process.env[`STATE_${name}`] || '';
}
exports.getState = getState;
//# sourceMappingURL=core.js.map

/***/ }),

/***/ 717:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

// For internal use, subject to change.
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
const fs = __importStar(__webpack_require__(35747));
const os = __importStar(__webpack_require__(12087));
const utils_1 = __webpack_require__(5278);
function issueCommand(command, message) {
    const filePath = process.env[`GITHUB_${command}`];
    if (!filePath) {
        throw new Error(`Unable to find environment variable for file command ${command}`);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file at path: ${filePath}`);
    }
    fs.appendFileSync(filePath, `${utils_1.toCommandValue(message)}${os.EOL}`, {
        encoding: 'utf8'
    });
}
exports.issueCommand = issueCommand;
//# sourceMappingURL=file-command.js.map

/***/ }),

/***/ 5278:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

// We use any as a valid input type
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Sanitizes an input into a string so it can be passed into issueCommand safely
 * @param input input to sanitize into a string
 */
function toCommandValue(input) {
    if (input === null || input === undefined) {
        return '';
    }
    else if (typeof input === 'string' || input instanceof String) {
        return input;
    }
    return JSON.stringify(input);
}
exports.toCommandValue = toCommandValue;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 28090:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const internal_globber_1 = __webpack_require__(28298);
/**
 * Constructs a globber
 *
 * @param patterns  Patterns separated by newlines
 * @param options   Glob options
 */
function create(patterns, options) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield internal_globber_1.DefaultGlobber.create(patterns, options);
    });
}
exports.create = create;
//# sourceMappingURL=glob.js.map

/***/ }),

/***/ 51026:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core = __webpack_require__(42186);
/**
 * Returns a copy with defaults filled in.
 */
function getOptions(copy) {
    const result = {
        followSymbolicLinks: true,
        implicitDescendants: true,
        omitBrokenSymbolicLinks: true
    };
    if (copy) {
        if (typeof copy.followSymbolicLinks === 'boolean') {
            result.followSymbolicLinks = copy.followSymbolicLinks;
            core.debug(`followSymbolicLinks '${result.followSymbolicLinks}'`);
        }
        if (typeof copy.implicitDescendants === 'boolean') {
            result.implicitDescendants = copy.implicitDescendants;
            core.debug(`implicitDescendants '${result.implicitDescendants}'`);
        }
        if (typeof copy.omitBrokenSymbolicLinks === 'boolean') {
            result.omitBrokenSymbolicLinks = copy.omitBrokenSymbolicLinks;
            core.debug(`omitBrokenSymbolicLinks '${result.omitBrokenSymbolicLinks}'`);
        }
    }
    return result;
}
exports.getOptions = getOptions;
//# sourceMappingURL=internal-glob-options-helper.js.map

/***/ }),

/***/ 28298:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const core = __webpack_require__(42186);
const fs = __webpack_require__(35747);
const globOptionsHelper = __webpack_require__(51026);
const path = __webpack_require__(85622);
const patternHelper = __webpack_require__(29005);
const internal_match_kind_1 = __webpack_require__(81063);
const internal_pattern_1 = __webpack_require__(64536);
const internal_search_state_1 = __webpack_require__(89117);
const IS_WINDOWS = process.platform === 'win32';
class DefaultGlobber {
    constructor(options) {
        this.patterns = [];
        this.searchPaths = [];
        this.options = globOptionsHelper.getOptions(options);
    }
    getSearchPaths() {
        // Return a copy
        return this.searchPaths.slice();
    }
    glob() {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            try {
                for (var _b = __asyncValues(this.globGenerator()), _c; _c = yield _b.next(), !_c.done;) {
                    const itemPath = _c.value;
                    result.push(itemPath);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) yield _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return result;
        });
    }
    globGenerator() {
        return __asyncGenerator(this, arguments, function* globGenerator_1() {
            // Fill in defaults options
            const options = globOptionsHelper.getOptions(this.options);
            // Implicit descendants?
            const patterns = [];
            for (const pattern of this.patterns) {
                patterns.push(pattern);
                if (options.implicitDescendants &&
                    (pattern.trailingSeparator ||
                        pattern.segments[pattern.segments.length - 1] !== '**')) {
                    patterns.push(new internal_pattern_1.Pattern(pattern.negate, pattern.segments.concat('**')));
                }
            }
            // Push the search paths
            const stack = [];
            for (const searchPath of patternHelper.getSearchPaths(patterns)) {
                core.debug(`Search path '${searchPath}'`);
                // Exists?
                try {
                    // Intentionally using lstat. Detection for broken symlink
                    // will be performed later (if following symlinks).
                    yield __await(fs.promises.lstat(searchPath));
                }
                catch (err) {
                    if (err.code === 'ENOENT') {
                        continue;
                    }
                    throw err;
                }
                stack.unshift(new internal_search_state_1.SearchState(searchPath, 1));
            }
            // Search
            const traversalChain = []; // used to detect cycles
            while (stack.length) {
                // Pop
                const item = stack.pop();
                // Match?
                const match = patternHelper.match(patterns, item.path);
                const partialMatch = !!match || patternHelper.partialMatch(patterns, item.path);
                if (!match && !partialMatch) {
                    continue;
                }
                // Stat
                const stats = yield __await(DefaultGlobber.stat(item, options, traversalChain)
                // Broken symlink, or symlink cycle detected, or no longer exists
                );
                // Broken symlink, or symlink cycle detected, or no longer exists
                if (!stats) {
                    continue;
                }
                // Directory
                if (stats.isDirectory()) {
                    // Matched
                    if (match & internal_match_kind_1.MatchKind.Directory) {
                        yield yield __await(item.path);
                    }
                    // Descend?
                    else if (!partialMatch) {
                        continue;
                    }
                    // Push the child items in reverse
                    const childLevel = item.level + 1;
                    const childItems = (yield __await(fs.promises.readdir(item.path))).map(x => new internal_search_state_1.SearchState(path.join(item.path, x), childLevel));
                    stack.push(...childItems.reverse());
                }
                // File
                else if (match & internal_match_kind_1.MatchKind.File) {
                    yield yield __await(item.path);
                }
            }
        });
    }
    /**
     * Constructs a DefaultGlobber
     */
    static create(patterns, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new DefaultGlobber(options);
            if (IS_WINDOWS) {
                patterns = patterns.replace(/\r\n/g, '\n');
                patterns = patterns.replace(/\r/g, '\n');
            }
            const lines = patterns.split('\n').map(x => x.trim());
            for (const line of lines) {
                // Empty or comment
                if (!line || line.startsWith('#')) {
                    continue;
                }
                // Pattern
                else {
                    result.patterns.push(new internal_pattern_1.Pattern(line));
                }
            }
            result.searchPaths.push(...patternHelper.getSearchPaths(result.patterns));
            return result;
        });
    }
    static stat(item, options, traversalChain) {
        return __awaiter(this, void 0, void 0, function* () {
            // Note:
            // `stat` returns info about the target of a symlink (or symlink chain)
            // `lstat` returns info about a symlink itself
            let stats;
            if (options.followSymbolicLinks) {
                try {
                    // Use `stat` (following symlinks)
                    stats = yield fs.promises.stat(item.path);
                }
                catch (err) {
                    if (err.code === 'ENOENT') {
                        if (options.omitBrokenSymbolicLinks) {
                            core.debug(`Broken symlink '${item.path}'`);
                            return undefined;
                        }
                        throw new Error(`No information found for the path '${item.path}'. This may indicate a broken symbolic link.`);
                    }
                    throw err;
                }
            }
            else {
                // Use `lstat` (not following symlinks)
                stats = yield fs.promises.lstat(item.path);
            }
            // Note, isDirectory() returns false for the lstat of a symlink
            if (stats.isDirectory() && options.followSymbolicLinks) {
                // Get the realpath
                const realPath = yield fs.promises.realpath(item.path);
                // Fixup the traversal chain to match the item level
                while (traversalChain.length >= item.level) {
                    traversalChain.pop();
                }
                // Test for a cycle
                if (traversalChain.some((x) => x === realPath)) {
                    core.debug(`Symlink cycle detected for path '${item.path}' and realpath '${realPath}'`);
                    return undefined;
                }
                // Update the traversal chain
                traversalChain.push(realPath);
            }
            return stats;
        });
    }
}
exports.DefaultGlobber = DefaultGlobber;
//# sourceMappingURL=internal-globber.js.map

/***/ }),

/***/ 81063:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Indicates whether a pattern matches a path
 */
var MatchKind;
(function (MatchKind) {
    /** Not matched */
    MatchKind[MatchKind["None"] = 0] = "None";
    /** Matched if the path is a directory */
    MatchKind[MatchKind["Directory"] = 1] = "Directory";
    /** Matched if the path is a regular file */
    MatchKind[MatchKind["File"] = 2] = "File";
    /** Matched */
    MatchKind[MatchKind["All"] = 3] = "All";
})(MatchKind = exports.MatchKind || (exports.MatchKind = {}));
//# sourceMappingURL=internal-match-kind.js.map

/***/ }),

/***/ 1849:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const assert = __webpack_require__(42357);
const path = __webpack_require__(85622);
const IS_WINDOWS = process.platform === 'win32';
/**
 * Similar to path.dirname except normalizes the path separators and slightly better handling for Windows UNC paths.
 *
 * For example, on Linux/macOS:
 * - `/               => /`
 * - `/hello          => /`
 *
 * For example, on Windows:
 * - `C:\             => C:\`
 * - `C:\hello        => C:\`
 * - `C:              => C:`
 * - `C:hello         => C:`
 * - `\               => \`
 * - `\hello          => \`
 * - `\\hello         => \\hello`
 * - `\\hello\world   => \\hello\world`
 */
function dirname(p) {
    // Normalize slashes and trim unnecessary trailing slash
    p = safeTrimTrailingSeparator(p);
    // Windows UNC root, e.g. \\hello or \\hello\world
    if (IS_WINDOWS && /^\\\\[^\\]+(\\[^\\]+)?$/.test(p)) {
        return p;
    }
    // Get dirname
    let result = path.dirname(p);
    // Trim trailing slash for Windows UNC root, e.g. \\hello\world\
    if (IS_WINDOWS && /^\\\\[^\\]+\\[^\\]+\\$/.test(result)) {
        result = safeTrimTrailingSeparator(result);
    }
    return result;
}
exports.dirname = dirname;
/**
 * Roots the path if not already rooted. On Windows, relative roots like `\`
 * or `C:` are expanded based on the current working directory.
 */
function ensureAbsoluteRoot(root, itemPath) {
    assert(root, `ensureAbsoluteRoot parameter 'root' must not be empty`);
    assert(itemPath, `ensureAbsoluteRoot parameter 'itemPath' must not be empty`);
    // Already rooted
    if (hasAbsoluteRoot(itemPath)) {
        return itemPath;
    }
    // Windows
    if (IS_WINDOWS) {
        // Check for itemPath like C: or C:foo
        if (itemPath.match(/^[A-Z]:[^\\/]|^[A-Z]:$/i)) {
            let cwd = process.cwd();
            assert(cwd.match(/^[A-Z]:\\/i), `Expected current directory to start with an absolute drive root. Actual '${cwd}'`);
            // Drive letter matches cwd? Expand to cwd
            if (itemPath[0].toUpperCase() === cwd[0].toUpperCase()) {
                // Drive only, e.g. C:
                if (itemPath.length === 2) {
                    // Preserve specified drive letter case (upper or lower)
                    return `${itemPath[0]}:\\${cwd.substr(3)}`;
                }
                // Drive + path, e.g. C:foo
                else {
                    if (!cwd.endsWith('\\')) {
                        cwd += '\\';
                    }
                    // Preserve specified drive letter case (upper or lower)
                    return `${itemPath[0]}:\\${cwd.substr(3)}${itemPath.substr(2)}`;
                }
            }
            // Different drive
            else {
                return `${itemPath[0]}:\\${itemPath.substr(2)}`;
            }
        }
        // Check for itemPath like \ or \foo
        else if (normalizeSeparators(itemPath).match(/^\\$|^\\[^\\]/)) {
            const cwd = process.cwd();
            assert(cwd.match(/^[A-Z]:\\/i), `Expected current directory to start with an absolute drive root. Actual '${cwd}'`);
            return `${cwd[0]}:\\${itemPath.substr(1)}`;
        }
    }
    assert(hasAbsoluteRoot(root), `ensureAbsoluteRoot parameter 'root' must have an absolute root`);
    // Otherwise ensure root ends with a separator
    if (root.endsWith('/') || (IS_WINDOWS && root.endsWith('\\'))) {
        // Intentionally empty
    }
    else {
        // Append separator
        root += path.sep;
    }
    return root + itemPath;
}
exports.ensureAbsoluteRoot = ensureAbsoluteRoot;
/**
 * On Linux/macOS, true if path starts with `/`. On Windows, true for paths like:
 * `\\hello\share` and `C:\hello` (and using alternate separator).
 */
function hasAbsoluteRoot(itemPath) {
    assert(itemPath, `hasAbsoluteRoot parameter 'itemPath' must not be empty`);
    // Normalize separators
    itemPath = normalizeSeparators(itemPath);
    // Windows
    if (IS_WINDOWS) {
        // E.g. \\hello\share or C:\hello
        return itemPath.startsWith('\\\\') || /^[A-Z]:\\/i.test(itemPath);
    }
    // E.g. /hello
    return itemPath.startsWith('/');
}
exports.hasAbsoluteRoot = hasAbsoluteRoot;
/**
 * On Linux/macOS, true if path starts with `/`. On Windows, true for paths like:
 * `\`, `\hello`, `\\hello\share`, `C:`, and `C:\hello` (and using alternate separator).
 */
function hasRoot(itemPath) {
    assert(itemPath, `isRooted parameter 'itemPath' must not be empty`);
    // Normalize separators
    itemPath = normalizeSeparators(itemPath);
    // Windows
    if (IS_WINDOWS) {
        // E.g. \ or \hello or \\hello
        // E.g. C: or C:\hello
        return itemPath.startsWith('\\') || /^[A-Z]:/i.test(itemPath);
    }
    // E.g. /hello
    return itemPath.startsWith('/');
}
exports.hasRoot = hasRoot;
/**
 * Removes redundant slashes and converts `/` to `\` on Windows
 */
function normalizeSeparators(p) {
    p = p || '';
    // Windows
    if (IS_WINDOWS) {
        // Convert slashes on Windows
        p = p.replace(/\//g, '\\');
        // Remove redundant slashes
        const isUnc = /^\\\\+[^\\]/.test(p); // e.g. \\hello
        return (isUnc ? '\\' : '') + p.replace(/\\\\+/g, '\\'); // preserve leading \\ for UNC
    }
    // Remove redundant slashes
    return p.replace(/\/\/+/g, '/');
}
exports.normalizeSeparators = normalizeSeparators;
/**
 * Normalizes the path separators and trims the trailing separator (when safe).
 * For example, `/foo/ => /foo` but `/ => /`
 */
function safeTrimTrailingSeparator(p) {
    // Short-circuit if empty
    if (!p) {
        return '';
    }
    // Normalize separators
    p = normalizeSeparators(p);
    // No trailing slash
    if (!p.endsWith(path.sep)) {
        return p;
    }
    // Check '/' on Linux/macOS and '\' on Windows
    if (p === path.sep) {
        return p;
    }
    // On Windows check if drive root. E.g. C:\
    if (IS_WINDOWS && /^[A-Z]:\\$/i.test(p)) {
        return p;
    }
    // Otherwise trim trailing slash
    return p.substr(0, p.length - 1);
}
exports.safeTrimTrailingSeparator = safeTrimTrailingSeparator;
//# sourceMappingURL=internal-path-helper.js.map

/***/ }),

/***/ 96836:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const assert = __webpack_require__(42357);
const path = __webpack_require__(85622);
const pathHelper = __webpack_require__(1849);
const IS_WINDOWS = process.platform === 'win32';
/**
 * Helper class for parsing paths into segments
 */
class Path {
    /**
     * Constructs a Path
     * @param itemPath Path or array of segments
     */
    constructor(itemPath) {
        this.segments = [];
        // String
        if (typeof itemPath === 'string') {
            assert(itemPath, `Parameter 'itemPath' must not be empty`);
            // Normalize slashes and trim unnecessary trailing slash
            itemPath = pathHelper.safeTrimTrailingSeparator(itemPath);
            // Not rooted
            if (!pathHelper.hasRoot(itemPath)) {
                this.segments = itemPath.split(path.sep);
            }
            // Rooted
            else {
                // Add all segments, while not at the root
                let remaining = itemPath;
                let dir = pathHelper.dirname(remaining);
                while (dir !== remaining) {
                    // Add the segment
                    const basename = path.basename(remaining);
                    this.segments.unshift(basename);
                    // Truncate the last segment
                    remaining = dir;
                    dir = pathHelper.dirname(remaining);
                }
                // Remainder is the root
                this.segments.unshift(remaining);
            }
        }
        // Array
        else {
            // Must not be empty
            assert(itemPath.length > 0, `Parameter 'itemPath' must not be an empty array`);
            // Each segment
            for (let i = 0; i < itemPath.length; i++) {
                let segment = itemPath[i];
                // Must not be empty
                assert(segment, `Parameter 'itemPath' must not contain any empty segments`);
                // Normalize slashes
                segment = pathHelper.normalizeSeparators(itemPath[i]);
                // Root segment
                if (i === 0 && pathHelper.hasRoot(segment)) {
                    segment = pathHelper.safeTrimTrailingSeparator(segment);
                    assert(segment === pathHelper.dirname(segment), `Parameter 'itemPath' root segment contains information for multiple segments`);
                    this.segments.push(segment);
                }
                // All other segments
                else {
                    // Must not contain slash
                    assert(!segment.includes(path.sep), `Parameter 'itemPath' contains unexpected path separators`);
                    this.segments.push(segment);
                }
            }
        }
    }
    /**
     * Converts the path to it's string representation
     */
    toString() {
        // First segment
        let result = this.segments[0];
        // All others
        let skipSlash = result.endsWith(path.sep) || (IS_WINDOWS && /^[A-Z]:$/i.test(result));
        for (let i = 1; i < this.segments.length; i++) {
            if (skipSlash) {
                skipSlash = false;
            }
            else {
                result += path.sep;
            }
            result += this.segments[i];
        }
        return result;
    }
}
exports.Path = Path;
//# sourceMappingURL=internal-path.js.map

/***/ }),

/***/ 29005:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const pathHelper = __webpack_require__(1849);
const internal_match_kind_1 = __webpack_require__(81063);
const IS_WINDOWS = process.platform === 'win32';
/**
 * Given an array of patterns, returns an array of paths to search.
 * Duplicates and paths under other included paths are filtered out.
 */
function getSearchPaths(patterns) {
    // Ignore negate patterns
    patterns = patterns.filter(x => !x.negate);
    // Create a map of all search paths
    const searchPathMap = {};
    for (const pattern of patterns) {
        const key = IS_WINDOWS
            ? pattern.searchPath.toUpperCase()
            : pattern.searchPath;
        searchPathMap[key] = 'candidate';
    }
    const result = [];
    for (const pattern of patterns) {
        // Check if already included
        const key = IS_WINDOWS
            ? pattern.searchPath.toUpperCase()
            : pattern.searchPath;
        if (searchPathMap[key] === 'included') {
            continue;
        }
        // Check for an ancestor search path
        let foundAncestor = false;
        let tempKey = key;
        let parent = pathHelper.dirname(tempKey);
        while (parent !== tempKey) {
            if (searchPathMap[parent]) {
                foundAncestor = true;
                break;
            }
            tempKey = parent;
            parent = pathHelper.dirname(tempKey);
        }
        // Include the search pattern in the result
        if (!foundAncestor) {
            result.push(pattern.searchPath);
            searchPathMap[key] = 'included';
        }
    }
    return result;
}
exports.getSearchPaths = getSearchPaths;
/**
 * Matches the patterns against the path
 */
function match(patterns, itemPath) {
    let result = internal_match_kind_1.MatchKind.None;
    for (const pattern of patterns) {
        if (pattern.negate) {
            result &= ~pattern.match(itemPath);
        }
        else {
            result |= pattern.match(itemPath);
        }
    }
    return result;
}
exports.match = match;
/**
 * Checks whether to descend further into the directory
 */
function partialMatch(patterns, itemPath) {
    return patterns.some(x => !x.negate && x.partialMatch(itemPath));
}
exports.partialMatch = partialMatch;
//# sourceMappingURL=internal-pattern-helper.js.map

/***/ }),

/***/ 64536:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const assert = __webpack_require__(42357);
const os = __webpack_require__(12087);
const path = __webpack_require__(85622);
const pathHelper = __webpack_require__(1849);
const minimatch_1 = __webpack_require__(83973);
const internal_match_kind_1 = __webpack_require__(81063);
const internal_path_1 = __webpack_require__(96836);
const IS_WINDOWS = process.platform === 'win32';
class Pattern {
    constructor(patternOrNegate, segments) {
        /**
         * Indicates whether matches should be excluded from the result set
         */
        this.negate = false;
        // Pattern overload
        let pattern;
        if (typeof patternOrNegate === 'string') {
            pattern = patternOrNegate.trim();
        }
        // Segments overload
        else {
            // Convert to pattern
            segments = segments || [];
            assert(segments.length, `Parameter 'segments' must not empty`);
            const root = Pattern.getLiteral(segments[0]);
            assert(root && pathHelper.hasAbsoluteRoot(root), `Parameter 'segments' first element must be a root path`);
            pattern = new internal_path_1.Path(segments).toString().trim();
            if (patternOrNegate) {
                pattern = `!${pattern}`;
            }
        }
        // Negate
        while (pattern.startsWith('!')) {
            this.negate = !this.negate;
            pattern = pattern.substr(1).trim();
        }
        // Normalize slashes and ensures absolute root
        pattern = Pattern.fixupPattern(pattern);
        // Segments
        this.segments = new internal_path_1.Path(pattern).segments;
        // Trailing slash indicates the pattern should only match directories, not regular files
        this.trailingSeparator = pathHelper
            .normalizeSeparators(pattern)
            .endsWith(path.sep);
        pattern = pathHelper.safeTrimTrailingSeparator(pattern);
        // Search path (literal path prior to the first glob segment)
        let foundGlob = false;
        const searchSegments = this.segments
            .map(x => Pattern.getLiteral(x))
            .filter(x => !foundGlob && !(foundGlob = x === ''));
        this.searchPath = new internal_path_1.Path(searchSegments).toString();
        // Root RegExp (required when determining partial match)
        this.rootRegExp = new RegExp(Pattern.regExpEscape(searchSegments[0]), IS_WINDOWS ? 'i' : '');
        // Create minimatch
        const minimatchOptions = {
            dot: true,
            nobrace: true,
            nocase: IS_WINDOWS,
            nocomment: true,
            noext: true,
            nonegate: true
        };
        pattern = IS_WINDOWS ? pattern.replace(/\\/g, '/') : pattern;
        this.minimatch = new minimatch_1.Minimatch(pattern, minimatchOptions);
    }
    /**
     * Matches the pattern against the specified path
     */
    match(itemPath) {
        // Last segment is globstar?
        if (this.segments[this.segments.length - 1] === '**') {
            // Normalize slashes
            itemPath = pathHelper.normalizeSeparators(itemPath);
            // Append a trailing slash. Otherwise Minimatch will not match the directory immediately
            // preceeding the globstar. For example, given the pattern `/foo/**`, Minimatch returns
            // false for `/foo` but returns true for `/foo/`. Append a trailing slash to handle that quirk.
            if (!itemPath.endsWith(path.sep)) {
                // Note, this is safe because the constructor ensures the pattern has an absolute root.
                // For example, formats like C: and C:foo on Windows are resolved to an aboslute root.
                itemPath = `${itemPath}${path.sep}`;
            }
        }
        else {
            // Normalize slashes and trim unnecessary trailing slash
            itemPath = pathHelper.safeTrimTrailingSeparator(itemPath);
        }
        // Match
        if (this.minimatch.match(itemPath)) {
            return this.trailingSeparator ? internal_match_kind_1.MatchKind.Directory : internal_match_kind_1.MatchKind.All;
        }
        return internal_match_kind_1.MatchKind.None;
    }
    /**
     * Indicates whether the pattern may match descendants of the specified path
     */
    partialMatch(itemPath) {
        // Normalize slashes and trim unnecessary trailing slash
        itemPath = pathHelper.safeTrimTrailingSeparator(itemPath);
        // matchOne does not handle root path correctly
        if (pathHelper.dirname(itemPath) === itemPath) {
            return this.rootRegExp.test(itemPath);
        }
        return this.minimatch.matchOne(itemPath.split(IS_WINDOWS ? /\\+/ : /\/+/), this.minimatch.set[0], true);
    }
    /**
     * Escapes glob patterns within a path
     */
    static globEscape(s) {
        return (IS_WINDOWS ? s : s.replace(/\\/g, '\\\\')) // escape '\' on Linux/macOS
            .replace(/(\[)(?=[^/]+\])/g, '[[]') // escape '[' when ']' follows within the path segment
            .replace(/\?/g, '[?]') // escape '?'
            .replace(/\*/g, '[*]'); // escape '*'
    }
    /**
     * Normalizes slashes and ensures absolute root
     */
    static fixupPattern(pattern) {
        // Empty
        assert(pattern, 'pattern cannot be empty');
        // Must not contain `.` segment, unless first segment
        // Must not contain `..` segment
        const literalSegments = new internal_path_1.Path(pattern).segments.map(x => Pattern.getLiteral(x));
        assert(literalSegments.every((x, i) => (x !== '.' || i === 0) && x !== '..'), `Invalid pattern '${pattern}'. Relative pathing '.' and '..' is not allowed.`);
        // Must not contain globs in root, e.g. Windows UNC path \\foo\b*r
        assert(!pathHelper.hasRoot(pattern) || literalSegments[0], `Invalid pattern '${pattern}'. Root segment must not contain globs.`);
        // Normalize slashes
        pattern = pathHelper.normalizeSeparators(pattern);
        // Replace leading `.` segment
        if (pattern === '.' || pattern.startsWith(`.${path.sep}`)) {
            pattern = Pattern.globEscape(process.cwd()) + pattern.substr(1);
        }
        // Replace leading `~` segment
        else if (pattern === '~' || pattern.startsWith(`~${path.sep}`)) {
            const homedir = os.homedir();
            assert(homedir, 'Unable to determine HOME directory');
            assert(pathHelper.hasAbsoluteRoot(homedir), `Expected HOME directory to be a rooted path. Actual '${homedir}'`);
            pattern = Pattern.globEscape(homedir) + pattern.substr(1);
        }
        // Replace relative drive root, e.g. pattern is C: or C:foo
        else if (IS_WINDOWS &&
            (pattern.match(/^[A-Z]:$/i) || pattern.match(/^[A-Z]:[^\\]/i))) {
            let root = pathHelper.ensureAbsoluteRoot('C:\\dummy-root', pattern.substr(0, 2));
            if (pattern.length > 2 && !root.endsWith('\\')) {
                root += '\\';
            }
            pattern = Pattern.globEscape(root) + pattern.substr(2);
        }
        // Replace relative root, e.g. pattern is \ or \foo
        else if (IS_WINDOWS && (pattern === '\\' || pattern.match(/^\\[^\\]/))) {
            let root = pathHelper.ensureAbsoluteRoot('C:\\dummy-root', '\\');
            if (!root.endsWith('\\')) {
                root += '\\';
            }
            pattern = Pattern.globEscape(root) + pattern.substr(1);
        }
        // Otherwise ensure absolute root
        else {
            pattern = pathHelper.ensureAbsoluteRoot(Pattern.globEscape(process.cwd()), pattern);
        }
        return pathHelper.normalizeSeparators(pattern);
    }
    /**
     * Attempts to unescape a pattern segment to create a literal path segment.
     * Otherwise returns empty string.
     */
    static getLiteral(segment) {
        let literal = '';
        for (let i = 0; i < segment.length; i++) {
            const c = segment[i];
            // Escape
            if (c === '\\' && !IS_WINDOWS && i + 1 < segment.length) {
                literal += segment[++i];
                continue;
            }
            // Wildcard
            else if (c === '*' || c === '?') {
                return '';
            }
            // Character set
            else if (c === '[' && i + 1 < segment.length) {
                let set = '';
                let closed = -1;
                for (let i2 = i + 1; i2 < segment.length; i2++) {
                    const c2 = segment[i2];
                    // Escape
                    if (c2 === '\\' && !IS_WINDOWS && i2 + 1 < segment.length) {
                        set += segment[++i2];
                        continue;
                    }
                    // Closed
                    else if (c2 === ']') {
                        closed = i2;
                        break;
                    }
                    // Otherwise
                    else {
                        set += c2;
                    }
                }
                // Closed?
                if (closed >= 0) {
                    // Cannot convert
                    if (set.length > 1) {
                        return '';
                    }
                    // Convert to literal
                    if (set) {
                        literal += set;
                        i = closed;
                        continue;
                    }
                }
                // Otherwise fall thru
            }
            // Append
            literal += c;
        }
        return literal;
    }
    /**
     * Escapes regexp special characters
     * https://javascript.info/regexp-escaping
     */
    static regExpEscape(s) {
        return s.replace(/[[\\^$.|?*+()]/g, '\\$&');
    }
}
exports.Pattern = Pattern;
//# sourceMappingURL=internal-pattern.js.map

/***/ }),

/***/ 89117:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
class SearchState {
    constructor(path, level) {
        this.path = path;
        this.level = level;
    }
}
exports.SearchState = SearchState;
//# sourceMappingURL=internal-search-state.js.map

/***/ }),

/***/ 68892:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var is_array_buffer_1 = __webpack_require__(47749);
function applyBodyChecksumMiddleware(headerName, hashCtor, encoder, streamHasher) {
    var _this = this;
    if (streamHasher === void 0) { streamHasher = throwOnStream; }
    return function (next) { return function (_a) {
        var request = _a.request, input = _a.input;
        return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var _b, body, headers, digest, hash, _c, _d, _e, _f, _g;
            return tslib_1.__generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        body = request.body, headers = request.headers;
                        if (!!hasHeader(headerName, headers)) return [3 /*break*/, 2];
                        digest = void 0;
                        if (body === undefined ||
                            typeof body === "string" ||
                            ArrayBuffer.isView(body) ||
                            is_array_buffer_1.isArrayBuffer(body)) {
                            hash = new hashCtor();
                            hash.update(body || "");
                            digest = hash.digest();
                        }
                        else {
                            digest = streamHasher(hashCtor, body);
                        }
                        _c = [{}, request];
                        _d = {};
                        _e = [{}, headers];
                        _b = {};
                        _f = headerName;
                        _g = encoder;
                        return [4 /*yield*/, digest];
                    case 1:
                        request = tslib_1.__assign.apply(void 0, _c.concat([(_d.headers = tslib_1.__assign.apply(void 0, _e.concat([(_b[_f] = _g.apply(void 0, [_h.sent()]), _b)])), _d)]));
                        _h.label = 2;
                    case 2: return [2 /*return*/, next({ input: input, request: request })];
                }
            });
        });
    }; };
}
exports.applyBodyChecksumMiddleware = applyBodyChecksumMiddleware;
function hasHeader(soughtHeader, headers) {
    var e_1, _a;
    soughtHeader = soughtHeader.toLowerCase();
    try {
        for (var _b = tslib_1.__values(Object.keys(headers)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var headerName = _c.value;
            if (soughtHeader === headerName.toLowerCase()) {
                return true;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return false;
}
function throwOnStream(stream) {
    throw new Error("applyBodyChecksumMiddleware encountered a request with a streaming body of type " + Object.prototype.toString.call(stream) + ", but no stream hasher function was provided");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNERBQXlEO0FBV3pELFNBQWdCLDJCQUEyQixDQUN6QyxVQUFrQixFQUNsQixRQUEwQixFQUMxQixPQUFnQixFQUNoQixZQUFzRDtJQUp4RCxpQkF3Q0M7SUFwQ0MsNkJBQUEsRUFBQSw0QkFBc0Q7SUFFdEQsT0FBTyxVQUNMLElBQW9DLElBQ0QsT0FBQSxVQUFPLEVBR1Y7WUFGaEMsb0JBQU8sRUFDUCxnQkFBSzs7Ozs7O3dCQUVHLElBQUksR0FBYyxPQUFPLEtBQXJCLEVBQUUsT0FBTyxHQUFLLE9BQU8sUUFBWixDQUFhOzZCQUM5QixDQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLEVBQS9CLHdCQUErQjt3QkFDN0IsTUFBTSxTQUFxQixDQUFDO3dCQUVoQyxJQUNFLElBQUksS0FBSyxTQUFTOzRCQUNsQixPQUFPLElBQUksS0FBSyxRQUFROzRCQUN4QixXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQzs0QkFDeEIsK0JBQWEsQ0FBQyxJQUFJLENBQUMsRUFDbkI7NEJBQ00sSUFBSSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7NEJBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDOzRCQUN4QixNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3lCQUN4Qjs2QkFBTTs0QkFDTCxNQUFNLEdBQUcsWUFBWSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQzt5QkFDdkM7a0NBR0ksT0FBTzs7a0NBRUwsT0FBTzs7d0JBQ1QsS0FBQSxVQUFVLENBQUE7d0JBQUcsS0FBQSxPQUFPLENBQUE7d0JBQUMscUJBQU0sTUFBTSxFQUFBOzt3QkFKdEMsT0FBTyw4Q0FFTCxVQUFPLHVEQUVTLGtCQUFRLFNBQVksRUFBQyxnQkFFdEMsQ0FBQzs7NEJBR0osc0JBQU8sSUFBSSxDQUFDLEVBQUUsS0FBSyxPQUFBLEVBQUUsT0FBTyxTQUFBLEVBQUUsQ0FBQyxFQUFDOzs7O0tBQ2pDLEVBL0JvQyxDQStCcEMsQ0FBQztBQUNKLENBQUM7QUF4Q0Qsa0VBd0NDO0FBRUQsU0FBUyxTQUFTLENBQUMsWUFBb0IsRUFBRSxPQUFrQjs7SUFDekQsWUFBWSxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7UUFDMUMsS0FBeUIsSUFBQSxLQUFBLGlCQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUEsZ0JBQUEsNEJBQUU7WUFBMUMsSUFBTSxVQUFVLFdBQUE7WUFDbkIsSUFBSSxZQUFZLEtBQUssVUFBVSxDQUFDLFdBQVcsRUFBRSxFQUFFO2dCQUM3QyxPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7Ozs7Ozs7OztJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLE1BQVc7SUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FDYixxRkFBbUYsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUMvRyxNQUFNLENBQ1AsaURBQThDLENBQ2hELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgaXNBcnJheUJ1ZmZlciB9IGZyb20gXCJAYXdzLXNkay9pcy1hcnJheS1idWZmZXJcIjtcbmltcG9ydCB7XG4gIEJ1aWxkSGFuZGxlcixcbiAgQnVpbGRIYW5kbGVyQXJndW1lbnRzLFxuICBCdWlsZE1pZGRsZXdhcmUsXG4gIEVuY29kZXIsXG4gIEhhc2gsXG4gIEhlYWRlckJhZyxcbiAgU3RyZWFtSGFzaGVyXG59IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlCb2R5Q2hlY2tzdW1NaWRkbGV3YXJlPFN0cmVhbVR5cGU+KFxuICBoZWFkZXJOYW1lOiBzdHJpbmcsXG4gIGhhc2hDdG9yOiB7IG5ldyAoKTogSGFzaCB9LFxuICBlbmNvZGVyOiBFbmNvZGVyLFxuICBzdHJlYW1IYXNoZXI6IFN0cmVhbUhhc2hlcjxTdHJlYW1UeXBlPiA9IHRocm93T25TdHJlYW1cbik6IEJ1aWxkTWlkZGxld2FyZTxhbnksIGFueSwgU3RyZWFtVHlwZT4ge1xuICByZXR1cm4gPE91dHB1dCBleHRlbmRzIG9iamVjdD4oXG4gICAgbmV4dDogQnVpbGRIYW5kbGVyPGFueSwgT3V0cHV0LCBhbnk+XG4gICk6IEJ1aWxkSGFuZGxlcjxhbnksIE91dHB1dCwgYW55PiA9PiBhc3luYyAoe1xuICAgIHJlcXVlc3QsXG4gICAgaW5wdXRcbiAgfTogQnVpbGRIYW5kbGVyQXJndW1lbnRzPGFueSwgYW55Pik6IFByb21pc2U8T3V0cHV0PiA9PiB7XG4gICAgY29uc3QgeyBib2R5LCBoZWFkZXJzIH0gPSByZXF1ZXN0O1xuICAgIGlmICghaGFzSGVhZGVyKGhlYWRlck5hbWUsIGhlYWRlcnMpKSB7XG4gICAgICBsZXQgZGlnZXN0OiBQcm9taXNlPFVpbnQ4QXJyYXk+O1xuXG4gICAgICBpZiAoXG4gICAgICAgIGJvZHkgPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICB0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIiB8fFxuICAgICAgICBBcnJheUJ1ZmZlci5pc1ZpZXcoYm9keSkgfHxcbiAgICAgICAgaXNBcnJheUJ1ZmZlcihib2R5KVxuICAgICAgKSB7XG4gICAgICAgIGNvbnN0IGhhc2ggPSBuZXcgaGFzaEN0b3IoKTtcbiAgICAgICAgaGFzaC51cGRhdGUoYm9keSB8fCBcIlwiKTtcbiAgICAgICAgZGlnZXN0ID0gaGFzaC5kaWdlc3QoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRpZ2VzdCA9IHN0cmVhbUhhc2hlcihoYXNoQ3RvciwgYm9keSk7XG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3QgPSB7XG4gICAgICAgIC4uLnJlcXVlc3QsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAuLi5oZWFkZXJzLFxuICAgICAgICAgIFtoZWFkZXJOYW1lXTogZW5jb2Rlcihhd2FpdCBkaWdlc3QpXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHQoeyBpbnB1dCwgcmVxdWVzdCB9KTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gaGFzSGVhZGVyKHNvdWdodEhlYWRlcjogc3RyaW5nLCBoZWFkZXJzOiBIZWFkZXJCYWcpOiBib29sZWFuIHtcbiAgc291Z2h0SGVhZGVyID0gc291Z2h0SGVhZGVyLnRvTG93ZXJDYXNlKCk7XG4gIGZvciAoY29uc3QgaGVhZGVyTmFtZSBvZiBPYmplY3Qua2V5cyhoZWFkZXJzKSkge1xuICAgIGlmIChzb3VnaHRIZWFkZXIgPT09IGhlYWRlck5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiB0aHJvd09uU3RyZWFtKHN0cmVhbTogYW55KTogbmV2ZXIge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgYGFwcGx5Qm9keUNoZWNrc3VtTWlkZGxld2FyZSBlbmNvdW50ZXJlZCBhIHJlcXVlc3Qgd2l0aCBhIHN0cmVhbWluZyBib2R5IG9mIHR5cGUgJHtPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoXG4gICAgICBzdHJlYW1cbiAgICApfSwgYnV0IG5vIHN0cmVhbSBoYXNoZXIgZnVuY3Rpb24gd2FzIHByb3ZpZGVkYFxuICApO1xufVxuIl19

/***/ }),

/***/ 49285:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var bucketHostname_1 = __webpack_require__(74228);
function bucketEndpointMiddleware(_a) {
    var _this = this;
    var _b = _a === void 0 ? {} : _a, _c = _b.forcePathStyle, forcePathStyle = _c === void 0 ? false : _c, _d = _b.preformedBucketEndpoint, preformedBucketEndpoint = _d === void 0 ? false : _d, _e = _b.useAccelerateEndpoint, useAccelerateEndpoint = _e === void 0 ? false : _e, _f = _b.useDualstackEndpoint, useDualstackEndpoint = _f === void 0 ? false : _f;
    return function (next) { return function (args) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a, bucketName, $bucketEndpoint, _b, $forcePathStyle, _c, $useAccelerateEndpoint, _d, $useDualstackEndpoint, replaceBucketInPath, request, _e, hostname, bucketEndpoint;
        return tslib_1.__generator(this, function (_f) {
            _a = args.input, bucketName = _a.Bucket, $bucketEndpoint = _a.$bucketEndpoint, _b = _a.$forcePathStyle, $forcePathStyle = _b === void 0 ? forcePathStyle : _b, _c = _a.$useAccelerateEndpoint, $useAccelerateEndpoint = _c === void 0 ? useAccelerateEndpoint : _c, _d = _a.$useDualstackEndpoint, $useDualstackEndpoint = _d === void 0 ? useDualstackEndpoint : _d;
            replaceBucketInPath = preformedBucketEndpoint || $bucketEndpoint;
            request = tslib_1.__assign({}, args.request);
            if ($bucketEndpoint) {
                request.hostname = bucketName;
            }
            else if (!preformedBucketEndpoint) {
                _e = bucketHostname_1.bucketHostname({
                    bucketName: bucketName,
                    baseHostname: request.hostname,
                    accelerateEndpoint: $useAccelerateEndpoint,
                    dualstackEndpoint: $useDualstackEndpoint,
                    pathStyleEndpoint: $forcePathStyle,
                    sslCompatible: request.protocol === "https:"
                }), hostname = _e.hostname, bucketEndpoint = _e.bucketEndpoint;
                request.hostname = hostname;
                replaceBucketInPath = bucketEndpoint;
            }
            if (replaceBucketInPath) {
                request.path = request.path.replace(/^(\/)?[^\/]+/, "");
                if (request.path === "") {
                    request.path = "/";
                }
            }
            return [2 /*return*/, next(tslib_1.__assign({}, args, { request: request }))];
        });
    }); }; };
}
exports.bucketEndpointMiddleware = bucketEndpointMiddleware;
//# sourceMappingURL=bucketEndpointMiddleware.js.map

/***/ }),

/***/ 74228:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var DOMAIN_PATTERN = /^[a-z0-9][a-z0-9\.\-]{1,61}[a-z0-9]$/;
var IP_ADDRESS_PATTERN = /(\d+\.){3}\d+/;
var DOTS_PATTERN = /\.\./;
var DOT_PATTERN = /\./;
var S3_HOSTNAME_PATTERN = /^(.+\.)?s3[.-]([a-z0-9-]+)\./;
var S3_US_EAST_1_ALTNAME_PATTERN = /^s3(-external-1)?\.amazonaws\.com$/;
var AWS_PARTITION_SUFFIX = "amazonaws.com";
function bucketHostname(_a) {
    var _b = _a.accelerateEndpoint, accelerateEndpoint = _b === void 0 ? false : _b, baseHostname = _a.baseHostname, bucketName = _a.bucketName, _c = _a.dualstackEndpoint, dualstackEndpoint = _c === void 0 ? false : _c, _d = _a.pathStyleEndpoint, pathStyleEndpoint = _d === void 0 ? false : _d, _e = _a.sslCompatible, sslCompatible = _e === void 0 ? true : _e;
    if (!S3_HOSTNAME_PATTERN.test(baseHostname)) {
        return {
            bucketEndpoint: false,
            hostname: baseHostname
        };
    }
    var _f = tslib_1.__read(S3_US_EAST_1_ALTNAME_PATTERN.test(baseHostname)
        ? ["us-east-1", AWS_PARTITION_SUFFIX]
        : partitionSuffix(baseHostname), 2), region = _f[0], hostnameSuffix = _f[1];
    if (pathStyleEndpoint ||
        !isDnsCompatibleBucketName(bucketName) ||
        (sslCompatible && DOT_PATTERN.test(bucketName))) {
        return {
            bucketEndpoint: false,
            hostname: dualstackEndpoint
                ? "s3.dualstack." + region + "." + hostnameSuffix
                : baseHostname
        };
    }
    if (accelerateEndpoint) {
        baseHostname = "s3-accelerate" + (dualstackEndpoint ? ".dualstack" : "") + "." + hostnameSuffix;
    }
    else if (dualstackEndpoint) {
        baseHostname = "s3.dualstack." + region + "." + hostnameSuffix;
    }
    return {
        bucketEndpoint: true,
        hostname: bucketName + "." + baseHostname
    };
}
exports.bucketHostname = bucketHostname;
/**
 * Determines whether a given string is DNS compliant per the rules outlined by
 * S3. Length, capitaization, and leading dot restrictions are enforced by the
 * DOMAIN_PATTERN regular expression.
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
 */
function isDnsCompatibleBucketName(bucketName) {
    return (DOMAIN_PATTERN.test(bucketName) &&
        !IP_ADDRESS_PATTERN.test(bucketName) &&
        !DOTS_PATTERN.test(bucketName));
}
function partitionSuffix(hostname) {
    var parts = hostname.match(S3_HOSTNAME_PATTERN);
    return [parts[2], hostname.replace(new RegExp("^" + parts[0]), "")];
}
//# sourceMappingURL=bucketHostname.js.map

/***/ }),

/***/ 32829:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(49285), exports);
tslib_1.__exportStar(__webpack_require__(74228), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 85117:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var S3Client_1 = __webpack_require__(8833);
var AbortMultipartUploadCommand_1 = __webpack_require__(30455);
var CompleteMultipartUploadCommand_1 = __webpack_require__(39952);
var CopyObjectCommand_1 = __webpack_require__(8842);
var CreateBucketCommand_1 = __webpack_require__(41886);
var CreateMultipartUploadCommand_1 = __webpack_require__(97899);
var DeleteBucketAnalyticsConfigurationCommand_1 = __webpack_require__(1295);
var DeleteBucketCommand_1 = __webpack_require__(81629);
var DeleteBucketCorsCommand_1 = __webpack_require__(7682);
var DeleteBucketEncryptionCommand_1 = __webpack_require__(79727);
var DeleteBucketInventoryConfigurationCommand_1 = __webpack_require__(46927);
var DeleteBucketLifecycleCommand_1 = __webpack_require__(95010);
var DeleteBucketMetricsConfigurationCommand_1 = __webpack_require__(86030);
var DeleteBucketPolicyCommand_1 = __webpack_require__(58774);
var DeleteBucketReplicationCommand_1 = __webpack_require__(33723);
var DeleteBucketTaggingCommand_1 = __webpack_require__(53827);
var DeleteBucketWebsiteCommand_1 = __webpack_require__(89521);
var DeleteObjectCommand_1 = __webpack_require__(27864);
var DeleteObjectTaggingCommand_1 = __webpack_require__(89978);
var DeleteObjectsCommand_1 = __webpack_require__(74256);
var GetBucketAccelerateConfigurationCommand_1 = __webpack_require__(8672);
var GetBucketAclCommand_1 = __webpack_require__(11347);
var GetBucketAnalyticsConfigurationCommand_1 = __webpack_require__(93389);
var GetBucketCorsCommand_1 = __webpack_require__(89450);
var GetBucketEncryptionCommand_1 = __webpack_require__(7264);
var GetBucketInventoryConfigurationCommand_1 = __webpack_require__(10726);
var GetBucketLifecycleCommand_1 = __webpack_require__(97622);
var GetBucketLifecycleConfigurationCommand_1 = __webpack_require__(30931);
var GetBucketLocationCommand_1 = __webpack_require__(32459);
var GetBucketLoggingCommand_1 = __webpack_require__(82039);
var GetBucketMetricsConfigurationCommand_1 = __webpack_require__(14391);
var GetBucketNotificationCommand_1 = __webpack_require__(7645);
var GetBucketNotificationConfigurationCommand_1 = __webpack_require__(11885);
var GetBucketPolicyCommand_1 = __webpack_require__(55051);
var GetBucketReplicationCommand_1 = __webpack_require__(10547);
var GetBucketRequestPaymentCommand_1 = __webpack_require__(76044);
var GetBucketTaggingCommand_1 = __webpack_require__(14721);
var GetBucketVersioningCommand_1 = __webpack_require__(99133);
var GetBucketWebsiteCommand_1 = __webpack_require__(47543);
var GetObjectAclCommand_1 = __webpack_require__(71744);
var GetObjectCommand_1 = __webpack_require__(78242);
var GetObjectTaggingCommand_1 = __webpack_require__(32104);
var GetObjectTorrentCommand_1 = __webpack_require__(85541);
var HeadBucketCommand_1 = __webpack_require__(26930);
var HeadObjectCommand_1 = __webpack_require__(4493);
var ListBucketAnalyticsConfigurationsCommand_1 = __webpack_require__(47879);
var ListBucketInventoryConfigurationsCommand_1 = __webpack_require__(42335);
var ListBucketMetricsConfigurationsCommand_1 = __webpack_require__(83107);
var ListBucketsCommand_1 = __webpack_require__(14705);
var ListMultipartUploadsCommand_1 = __webpack_require__(54283);
var ListObjectVersionsCommand_1 = __webpack_require__(76786);
var ListObjectsCommand_1 = __webpack_require__(11021);
var ListObjectsV2Command_1 = __webpack_require__(46098);
var ListPartsCommand_1 = __webpack_require__(69851);
var PutBucketAccelerateConfigurationCommand_1 = __webpack_require__(16488);
var PutBucketAclCommand_1 = __webpack_require__(52835);
var PutBucketAnalyticsConfigurationCommand_1 = __webpack_require__(79573);
var PutBucketCorsCommand_1 = __webpack_require__(47671);
var PutBucketEncryptionCommand_1 = __webpack_require__(88138);
var PutBucketInventoryConfigurationCommand_1 = __webpack_require__(11979);
var PutBucketLifecycleCommand_1 = __webpack_require__(42831);
var PutBucketLifecycleConfigurationCommand_1 = __webpack_require__(6642);
var PutBucketLoggingCommand_1 = __webpack_require__(64732);
var PutBucketMetricsConfigurationCommand_1 = __webpack_require__(66294);
var PutBucketNotificationCommand_1 = __webpack_require__(16837);
var PutBucketNotificationConfigurationCommand_1 = __webpack_require__(61430);
var PutBucketPolicyCommand_1 = __webpack_require__(39048);
var PutBucketReplicationCommand_1 = __webpack_require__(44288);
var PutBucketRequestPaymentCommand_1 = __webpack_require__(43133);
var PutBucketTaggingCommand_1 = __webpack_require__(68940);
var PutBucketVersioningCommand_1 = __webpack_require__(56047);
var PutBucketWebsiteCommand_1 = __webpack_require__(22491);
var PutObjectAclCommand_1 = __webpack_require__(52769);
var PutObjectCommand_1 = __webpack_require__(75007);
var PutObjectTaggingCommand_1 = __webpack_require__(73377);
var RestoreObjectCommand_1 = __webpack_require__(50613);
var SelectObjectContentCommand_1 = __webpack_require__(71476);
var UploadPartCommand_1 = __webpack_require__(1946);
var UploadPartCopyCommand_1 = __webpack_require__(67354);
var S3 = /** @class */ (function (_super) {
    tslib_1.__extends(S3, _super);
    function S3() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    S3.prototype.abortMultipartUpload = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new AbortMultipartUploadCommand_1.AbortMultipartUploadCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.completeMultipartUpload = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new CompleteMultipartUploadCommand_1.CompleteMultipartUploadCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.copyObject = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new CopyObjectCommand_1.CopyObjectCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.createBucket = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new CreateBucketCommand_1.CreateBucketCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.createMultipartUpload = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new CreateMultipartUploadCommand_1.CreateMultipartUploadCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucket = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketCommand_1.DeleteBucketCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketAnalyticsConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketAnalyticsConfigurationCommand_1.DeleteBucketAnalyticsConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketCors = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketCorsCommand_1.DeleteBucketCorsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketEncryption = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketEncryptionCommand_1.DeleteBucketEncryptionCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketInventoryConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketInventoryConfigurationCommand_1.DeleteBucketInventoryConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketLifecycle = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketLifecycleCommand_1.DeleteBucketLifecycleCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketMetricsConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketMetricsConfigurationCommand_1.DeleteBucketMetricsConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketPolicy = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketPolicyCommand_1.DeleteBucketPolicyCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketReplication = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketReplicationCommand_1.DeleteBucketReplicationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketTagging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketTaggingCommand_1.DeleteBucketTaggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteBucketWebsite = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteBucketWebsiteCommand_1.DeleteBucketWebsiteCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteObject = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteObjectCommand_1.DeleteObjectCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteObjectTagging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteObjectTaggingCommand_1.DeleteObjectTaggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.deleteObjects = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new DeleteObjectsCommand_1.DeleteObjectsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketAccelerateConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketAccelerateConfigurationCommand_1.GetBucketAccelerateConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketAcl = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketAclCommand_1.GetBucketAclCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketAnalyticsConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketAnalyticsConfigurationCommand_1.GetBucketAnalyticsConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketCors = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketCorsCommand_1.GetBucketCorsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketEncryption = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketEncryptionCommand_1.GetBucketEncryptionCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketInventoryConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketInventoryConfigurationCommand_1.GetBucketInventoryConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketLifecycle = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketLifecycleCommand_1.GetBucketLifecycleCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketLifecycleConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketLifecycleConfigurationCommand_1.GetBucketLifecycleConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketLocation = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketLocationCommand_1.GetBucketLocationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketLogging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketLoggingCommand_1.GetBucketLoggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketMetricsConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketMetricsConfigurationCommand_1.GetBucketMetricsConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketNotification = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketNotificationCommand_1.GetBucketNotificationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketNotificationConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketNotificationConfigurationCommand_1.GetBucketNotificationConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketPolicy = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketPolicyCommand_1.GetBucketPolicyCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketReplication = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketReplicationCommand_1.GetBucketReplicationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketRequestPayment = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketRequestPaymentCommand_1.GetBucketRequestPaymentCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketTagging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketTaggingCommand_1.GetBucketTaggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketVersioning = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketVersioningCommand_1.GetBucketVersioningCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getBucketWebsite = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetBucketWebsiteCommand_1.GetBucketWebsiteCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getObject = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetObjectCommand_1.GetObjectCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getObjectAcl = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetObjectAclCommand_1.GetObjectAclCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getObjectTagging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetObjectTaggingCommand_1.GetObjectTaggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.getObjectTorrent = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new GetObjectTorrentCommand_1.GetObjectTorrentCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.headBucket = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new HeadBucketCommand_1.HeadBucketCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.headObject = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new HeadObjectCommand_1.HeadObjectCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listBucketAnalyticsConfigurations = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListBucketAnalyticsConfigurationsCommand_1.ListBucketAnalyticsConfigurationsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listBucketInventoryConfigurations = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListBucketInventoryConfigurationsCommand_1.ListBucketInventoryConfigurationsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listBucketMetricsConfigurations = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListBucketMetricsConfigurationsCommand_1.ListBucketMetricsConfigurationsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listBuckets = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListBucketsCommand_1.ListBucketsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listMultipartUploads = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListMultipartUploadsCommand_1.ListMultipartUploadsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listObjectVersions = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListObjectVersionsCommand_1.ListObjectVersionsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listObjects = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListObjectsCommand_1.ListObjectsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listObjectsV2 = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListObjectsV2Command_1.ListObjectsV2Command(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.listParts = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new ListPartsCommand_1.ListPartsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketAccelerateConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketAccelerateConfigurationCommand_1.PutBucketAccelerateConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketAcl = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketAclCommand_1.PutBucketAclCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketAnalyticsConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketAnalyticsConfigurationCommand_1.PutBucketAnalyticsConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketCors = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketCorsCommand_1.PutBucketCorsCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketEncryption = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketEncryptionCommand_1.PutBucketEncryptionCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketInventoryConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketInventoryConfigurationCommand_1.PutBucketInventoryConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketLifecycle = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketLifecycleCommand_1.PutBucketLifecycleCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketLifecycleConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketLifecycleConfigurationCommand_1.PutBucketLifecycleConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketLogging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketLoggingCommand_1.PutBucketLoggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketMetricsConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketMetricsConfigurationCommand_1.PutBucketMetricsConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketNotification = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketNotificationCommand_1.PutBucketNotificationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketNotificationConfiguration = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketNotificationConfigurationCommand_1.PutBucketNotificationConfigurationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketPolicy = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketPolicyCommand_1.PutBucketPolicyCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketReplication = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketReplicationCommand_1.PutBucketReplicationCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketRequestPayment = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketRequestPaymentCommand_1.PutBucketRequestPaymentCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketTagging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketTaggingCommand_1.PutBucketTaggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketVersioning = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketVersioningCommand_1.PutBucketVersioningCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putBucketWebsite = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutBucketWebsiteCommand_1.PutBucketWebsiteCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putObject = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutObjectCommand_1.PutObjectCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putObjectAcl = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutObjectAclCommand_1.PutObjectAclCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.putObjectTagging = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new PutObjectTaggingCommand_1.PutObjectTaggingCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.restoreObject = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new RestoreObjectCommand_1.RestoreObjectCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.selectObjectContent = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new SelectObjectContentCommand_1.SelectObjectContentCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.uploadPart = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new UploadPartCommand_1.UploadPartCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    S3.prototype.uploadPartCopy = function (args, cb) {
        // create the appropriate command and pass it to .send
        var command = new UploadPartCopyCommand_1.UploadPartCopyCommand(args);
        if (typeof cb === "function") {
            this.send(command, cb);
        }
        else {
            return this.send(command);
        }
    };
    return S3;
}(S3Client_1.S3Client));
exports.S3 = S3;
//# sourceMappingURL=S3.js.map

/***/ }),

/***/ 8833:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_config_resolver = __webpack_require__(17808);
var __aws_sdk_middleware_content_length = __webpack_require__(40802);
var __aws_sdk_middleware_expect_continue = __webpack_require__(62645);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_serializer = __webpack_require__(15910);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_retry_middleware = __webpack_require__(57901);
var __aws_sdk_signing_middleware = __webpack_require__(55824);
var __aws_sdk_util_user_agent_node = __webpack_require__(40185);
var S3Configuration_1 = __webpack_require__(1525);
var ServiceMetadata_1 = __webpack_require__(86326);
var S3Client = /** @class */ (function () {
    function S3Client(configuration) {
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
        this.config = __aws_sdk_config_resolver.resolveConfiguration(configuration, S3Configuration_1.configurationProperties, this.middlewareStack);
        this.middlewareStack.add(__aws_sdk_middleware_serializer.serializerMiddleware(this.config.serializer), {
            step: "serialize",
            priority: 90,
            tags: { SERIALIZER: true }
        });
        this.middlewareStack.add(__aws_sdk_middleware_content_length.contentLengthMiddleware(this.config.bodyLengthChecker), {
            step: "build",
            priority: -80,
            tags: { SET_CONTENT_LENGTH: true }
        });
        if (this.config.maxRetries > 0) {
            this.middlewareStack.add(__aws_sdk_retry_middleware.retryMiddleware(this.config.maxRetries, this.config.retryDecider, this.config.delayDecider), {
                step: "finalize",
                priority: Infinity,
                tags: { RETRY: true }
            });
        }
        this.middlewareStack.add(__aws_sdk_signing_middleware.signingMiddleware(this.config.signer), {
            step: "finalize",
            priority: 0,
            tags: { SIGNATURE: true }
        });
        this.middlewareStack.add(__aws_sdk_middleware_header_default.headerDefault({
            "User-Agent": __aws_sdk_util_user_agent_node.defaultUserAgent(ServiceMetadata_1.ServiceMetadata.serviceId || ServiceMetadata_1.ServiceMetadata.endpointPrefix, ServiceMetadata_1.clientVersion)
        }), {
            step: "build",
            priority: 0,
            tags: { SET_USER_AGENT: true }
        });
        this.middlewareStack.add(__aws_sdk_middleware_expect_continue.addExpectContinue, {
            step: "build",
            priority: 0,
            tags: { EXPECT_100_CONTINUE: true }
        });
    }
    S3Client.prototype.destroy = function () {
        if (!this.config._user_injected_http_handler) {
            this.config.httpHandler.destroy();
        }
    };
    S3Client.prototype.send = function (command, cb) {
        var handler = command.resolveMiddleware(this.middlewareStack, this.config);
        if (cb) {
            handler(command)
                .then(function (result) { return cb(null, result); }, function (err) { return cb(err); })
                .catch(
            // prevent any errors thrown in the callback from triggering an
            // unhandled promise rejection
            function () { });
        }
        else {
            return handler(command);
        }
    };
    return S3Client;
}());
exports.S3Client = S3Client;
//# sourceMappingURL=S3Client.js.map

/***/ }),

/***/ 1525:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_core_handler = __webpack_require__(64818);
var __aws_sdk_credential_provider_node = __webpack_require__(44091);
var __aws_sdk_hash_node = __webpack_require__(53612);
var __aws_sdk_hash_stream_node = __webpack_require__(95594);
var __aws_sdk_node_http_handler = __webpack_require__(17937);
var __aws_sdk_protocol_rest = __webpack_require__(88504);
var __aws_sdk_region_provider = __webpack_require__(19948);
var __aws_sdk_s3_error_unmarshaller = __webpack_require__(11839);
var __aws_sdk_signature_v4 = __webpack_require__(18550);
var __aws_sdk_stream_collector_node = __webpack_require__(18188);
var __aws_sdk_url_parser_node = __webpack_require__(4560);
var __aws_sdk_util_base64_node = __webpack_require__(31906);
var __aws_sdk_util_body_length_node = __webpack_require__(55479);
var __aws_sdk_util_utf8_node = __webpack_require__(19930);
var __aws_sdk_xml_body_builder = __webpack_require__(53419);
var __aws_sdk_xml_body_parser = __webpack_require__(52624);
exports.configurationProperties = {
    profile: {},
    maxRedirects: {
        defaultValue: 10
    },
    maxRetries: {
        defaultValue: 3
    },
    region: {
        defaultProvider: __aws_sdk_region_provider.defaultProvider,
        normalize: function (value) {
            if (typeof value === "string") {
                var promisified_1 = Promise.resolve(value);
                return function () { return promisified_1; };
            }
            return value;
        }
    },
    sslEnabled: {
        defaultValue: true
    },
    urlParser: {
        defaultValue: __aws_sdk_url_parser_node.parseUrl
    },
    endpointProvider: {
        defaultValue: function (sslEnabled, region) { return ({
            protocol: sslEnabled ? "https:" : "http:",
            path: "/",
            hostname: "s3." + region + ".amazonaws.com"
        }); }
    },
    endpoint: {
        defaultProvider: function (configuration) {
            var promisified = configuration
                .region()
                .then(function (region) {
                return configuration.endpointProvider(configuration.sslEnabled, region);
            });
            return function () { return promisified; };
        },
        normalize: function (value, configuration) {
            if (typeof value === "string") {
                var promisified_2 = Promise.resolve(configuration.urlParser(value));
                return function () { return promisified_2; };
            }
            else if (typeof value === "object") {
                var promisified_3 = Promise.resolve(value);
                return function () { return promisified_3; };
            }
            // Users are not required to supply an endpoint, so `value`
            // could be undefined. This function, however, will only be
            // invoked if `value` is defined, so the return will never
            // be undefined.
            return value;
        }
    },
    base64Decoder: {
        defaultValue: __aws_sdk_util_base64_node.fromBase64
    },
    base64Encoder: {
        defaultValue: __aws_sdk_util_base64_node.toBase64
    },
    utf8Decoder: {
        defaultValue: __aws_sdk_util_utf8_node.fromUtf8
    },
    utf8Encoder: {
        defaultValue: __aws_sdk_util_utf8_node.toUtf8
    },
    streamCollector: {
        defaultValue: __aws_sdk_stream_collector_node.streamCollector
    },
    serializer: {
        defaultProvider: function (configuration) {
            var promisified = configuration
                .endpoint()
                .then(function (endpoint) {
                return new __aws_sdk_protocol_rest.RestSerializer(endpoint, new __aws_sdk_xml_body_builder.XmlBodyBuilder(configuration.base64Encoder, configuration.utf8Decoder), configuration.base64Encoder, configuration.utf8Decoder);
            });
            return function () { return promisified; };
        }
    },
    parser: {
        defaultProvider: function (configuration) {
            return new __aws_sdk_protocol_rest.RestParser(new __aws_sdk_xml_body_parser.XmlBodyParser(configuration.base64Decoder), configuration.streamCollector, __aws_sdk_s3_error_unmarshaller.s3ErrorUnmarshaller, configuration.utf8Encoder, configuration.base64Decoder);
        }
    },
    _user_injected_http_handler: {
        defaultProvider: function (configuration) {
            return !configuration.httpHandler;
        }
    },
    httpHandler: {
        defaultProvider: function () { return new __aws_sdk_node_http_handler.NodeHttpHandler(); }
    },
    handler: {
        defaultProvider: function (configuration) {
            return __aws_sdk_core_handler.coreHandler(configuration.httpHandler, configuration.parser);
        }
    },
    bodyLengthChecker: {
        defaultValue: __aws_sdk_util_body_length_node.calculateBodyLength
    },
    retryDecider: {},
    delayDecider: {},
    credentials: {
        defaultProvider: __aws_sdk_credential_provider_node.defaultProvider,
        normalize: function (value) {
            if (typeof value === "object") {
                var promisified_4 = Promise.resolve(value);
                return function () { return promisified_4; };
            }
            return value;
        }
    },
    sha256: {
        defaultValue: __aws_sdk_hash_node.Hash.bind(null, "sha256")
    },
    signingName: {
        defaultValue: "s3"
    },
    signer: {
        defaultProvider: function (configuration) {
            return new __aws_sdk_signature_v4.SignatureV4({
                credentials: configuration.credentials,
                region: configuration.region,
                service: configuration.signingName,
                sha256: configuration.sha256,
                uriEscapePath: false
            });
        }
    },
    bucketEndpoint: {
        defaultValue: false
    },
    forcePathStyle: {
        defaultValue: false
    },
    useAccelerateEndpoint: {
        defaultValue: false
    },
    useDualstackEndpoint: {
        defaultValue: false
    },
    disableBodySigning: {
        defaultProvider: function (configuration) {
            return configuration.sslEnabled;
        }
    },
    streamHasher: {
        defaultValue: __aws_sdk_hash_stream_node.calculateSha256
    },
    md5: {
        defaultValue: __aws_sdk_hash_node.Hash.bind(null, "md5")
    }
};
//# sourceMappingURL=S3Configuration.js.map

/***/ }),

/***/ 30455:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var AbortMultipartUpload_1 = __webpack_require__(59723);
var AbortMultipartUploadCommand = /** @class */ (function () {
    function AbortMultipartUploadCommand(input) {
        this.input = input;
        this.model = AbortMultipartUpload_1.AbortMultipartUpload;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    AbortMultipartUploadCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return AbortMultipartUploadCommand;
}());
exports.AbortMultipartUploadCommand = AbortMultipartUploadCommand;
//# sourceMappingURL=AbortMultipartUploadCommand.js.map

/***/ }),

/***/ 39952:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var CompleteMultipartUpload_1 = __webpack_require__(79332);
var CompleteMultipartUploadCommand = /** @class */ (function () {
    function CompleteMultipartUploadCommand(input) {
        this.input = input;
        this.model = CompleteMultipartUpload_1.CompleteMultipartUpload;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    CompleteMultipartUploadCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return CompleteMultipartUploadCommand;
}());
exports.CompleteMultipartUploadCommand = CompleteMultipartUploadCommand;
//# sourceMappingURL=CompleteMultipartUploadCommand.js.map

/***/ }),

/***/ 8842:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var CopyObject_1 = __webpack_require__(50134);
var CopyObjectCommand = /** @class */ (function () {
    function CopyObjectCommand(input) {
        this.input = input;
        this.model = CopyObject_1.CopyObject;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    CopyObjectCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                },
                $copySourceServerSideEncryptionKey: {
                    targetProperty: "CopySourceSSECustomerKey",
                    hashTargetProperty: "CopySourceSSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return CopyObjectCommand;
}());
exports.CopyObjectCommand = CopyObjectCommand;
//# sourceMappingURL=CopyObjectCommand.js.map

/***/ }),

/***/ 41886:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_location_constraint_middleware = __webpack_require__(95686);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var CreateBucket_1 = __webpack_require__(93289);
var CreateBucketCommand = /** @class */ (function () {
    function CreateBucketCommand(input) {
        this.input = input;
        this.model = CreateBucket_1.CreateBucket;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    CreateBucketCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_location_constraint_middleware.locationConstraintMiddleware(configuration.region), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return CreateBucketCommand;
}());
exports.CreateBucketCommand = CreateBucketCommand;
//# sourceMappingURL=CreateBucketCommand.js.map

/***/ }),

/***/ 97899:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var CreateMultipartUpload_1 = __webpack_require__(41632);
var CreateMultipartUploadCommand = /** @class */ (function () {
    function CreateMultipartUploadCommand(input) {
        this.input = input;
        this.model = CreateMultipartUpload_1.CreateMultipartUpload;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    CreateMultipartUploadCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return CreateMultipartUploadCommand;
}());
exports.CreateMultipartUploadCommand = CreateMultipartUploadCommand;
//# sourceMappingURL=CreateMultipartUploadCommand.js.map

/***/ }),

/***/ 1295:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketAnalyticsConfiguration_1 = __webpack_require__(22951);
var DeleteBucketAnalyticsConfigurationCommand = /** @class */ (function () {
    function DeleteBucketAnalyticsConfigurationCommand(input) {
        this.input = input;
        this.model = DeleteBucketAnalyticsConfiguration_1.DeleteBucketAnalyticsConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketAnalyticsConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketAnalyticsConfigurationCommand;
}());
exports.DeleteBucketAnalyticsConfigurationCommand = DeleteBucketAnalyticsConfigurationCommand;
//# sourceMappingURL=DeleteBucketAnalyticsConfigurationCommand.js.map

/***/ }),

/***/ 81629:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucket_1 = __webpack_require__(56150);
var DeleteBucketCommand = /** @class */ (function () {
    function DeleteBucketCommand(input) {
        this.input = input;
        this.model = DeleteBucket_1.DeleteBucket;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketCommand;
}());
exports.DeleteBucketCommand = DeleteBucketCommand;
//# sourceMappingURL=DeleteBucketCommand.js.map

/***/ }),

/***/ 7682:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketCors_1 = __webpack_require__(20486);
var DeleteBucketCorsCommand = /** @class */ (function () {
    function DeleteBucketCorsCommand(input) {
        this.input = input;
        this.model = DeleteBucketCors_1.DeleteBucketCors;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketCorsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketCorsCommand;
}());
exports.DeleteBucketCorsCommand = DeleteBucketCorsCommand;
//# sourceMappingURL=DeleteBucketCorsCommand.js.map

/***/ }),

/***/ 79727:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketEncryption_1 = __webpack_require__(79423);
var DeleteBucketEncryptionCommand = /** @class */ (function () {
    function DeleteBucketEncryptionCommand(input) {
        this.input = input;
        this.model = DeleteBucketEncryption_1.DeleteBucketEncryption;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketEncryptionCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketEncryptionCommand;
}());
exports.DeleteBucketEncryptionCommand = DeleteBucketEncryptionCommand;
//# sourceMappingURL=DeleteBucketEncryptionCommand.js.map

/***/ }),

/***/ 46927:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketInventoryConfiguration_1 = __webpack_require__(72409);
var DeleteBucketInventoryConfigurationCommand = /** @class */ (function () {
    function DeleteBucketInventoryConfigurationCommand(input) {
        this.input = input;
        this.model = DeleteBucketInventoryConfiguration_1.DeleteBucketInventoryConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketInventoryConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketInventoryConfigurationCommand;
}());
exports.DeleteBucketInventoryConfigurationCommand = DeleteBucketInventoryConfigurationCommand;
//# sourceMappingURL=DeleteBucketInventoryConfigurationCommand.js.map

/***/ }),

/***/ 95010:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketLifecycle_1 = __webpack_require__(16284);
var DeleteBucketLifecycleCommand = /** @class */ (function () {
    function DeleteBucketLifecycleCommand(input) {
        this.input = input;
        this.model = DeleteBucketLifecycle_1.DeleteBucketLifecycle;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketLifecycleCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketLifecycleCommand;
}());
exports.DeleteBucketLifecycleCommand = DeleteBucketLifecycleCommand;
//# sourceMappingURL=DeleteBucketLifecycleCommand.js.map

/***/ }),

/***/ 86030:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketMetricsConfiguration_1 = __webpack_require__(93291);
var DeleteBucketMetricsConfigurationCommand = /** @class */ (function () {
    function DeleteBucketMetricsConfigurationCommand(input) {
        this.input = input;
        this.model = DeleteBucketMetricsConfiguration_1.DeleteBucketMetricsConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketMetricsConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketMetricsConfigurationCommand;
}());
exports.DeleteBucketMetricsConfigurationCommand = DeleteBucketMetricsConfigurationCommand;
//# sourceMappingURL=DeleteBucketMetricsConfigurationCommand.js.map

/***/ }),

/***/ 58774:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketPolicy_1 = __webpack_require__(97383);
var DeleteBucketPolicyCommand = /** @class */ (function () {
    function DeleteBucketPolicyCommand(input) {
        this.input = input;
        this.model = DeleteBucketPolicy_1.DeleteBucketPolicy;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketPolicyCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketPolicyCommand;
}());
exports.DeleteBucketPolicyCommand = DeleteBucketPolicyCommand;
//# sourceMappingURL=DeleteBucketPolicyCommand.js.map

/***/ }),

/***/ 33723:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketReplication_1 = __webpack_require__(43537);
var DeleteBucketReplicationCommand = /** @class */ (function () {
    function DeleteBucketReplicationCommand(input) {
        this.input = input;
        this.model = DeleteBucketReplication_1.DeleteBucketReplication;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketReplicationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketReplicationCommand;
}());
exports.DeleteBucketReplicationCommand = DeleteBucketReplicationCommand;
//# sourceMappingURL=DeleteBucketReplicationCommand.js.map

/***/ }),

/***/ 53827:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketTagging_1 = __webpack_require__(42904);
var DeleteBucketTaggingCommand = /** @class */ (function () {
    function DeleteBucketTaggingCommand(input) {
        this.input = input;
        this.model = DeleteBucketTagging_1.DeleteBucketTagging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketTaggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketTaggingCommand;
}());
exports.DeleteBucketTaggingCommand = DeleteBucketTaggingCommand;
//# sourceMappingURL=DeleteBucketTaggingCommand.js.map

/***/ }),

/***/ 89521:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteBucketWebsite_1 = __webpack_require__(81545);
var DeleteBucketWebsiteCommand = /** @class */ (function () {
    function DeleteBucketWebsiteCommand(input) {
        this.input = input;
        this.model = DeleteBucketWebsite_1.DeleteBucketWebsite;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteBucketWebsiteCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteBucketWebsiteCommand;
}());
exports.DeleteBucketWebsiteCommand = DeleteBucketWebsiteCommand;
//# sourceMappingURL=DeleteBucketWebsiteCommand.js.map

/***/ }),

/***/ 27864:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteObject_1 = __webpack_require__(49863);
var DeleteObjectCommand = /** @class */ (function () {
    function DeleteObjectCommand(input) {
        this.input = input;
        this.model = DeleteObject_1.DeleteObject;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteObjectCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteObjectCommand;
}());
exports.DeleteObjectCommand = DeleteObjectCommand;
//# sourceMappingURL=DeleteObjectCommand.js.map

/***/ }),

/***/ 89978:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteObjectTagging_1 = __webpack_require__(99666);
var DeleteObjectTaggingCommand = /** @class */ (function () {
    function DeleteObjectTaggingCommand(input) {
        this.input = input;
        this.model = DeleteObjectTagging_1.DeleteObjectTagging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteObjectTaggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteObjectTaggingCommand;
}());
exports.DeleteObjectTaggingCommand = DeleteObjectTaggingCommand;
//# sourceMappingURL=DeleteObjectTaggingCommand.js.map

/***/ }),

/***/ 74256:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_apply_body_checksum_middleware = __webpack_require__(68892);
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var DeleteObjects_1 = __webpack_require__(97001);
var DeleteObjectsCommand = /** @class */ (function () {
    function DeleteObjectsCommand(input) {
        this.input = input;
        this.model = DeleteObjects_1.DeleteObjects;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    DeleteObjectsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_apply_body_checksum_middleware.applyBodyChecksumMiddleware("Content-MD5", configuration.md5, configuration.base64Encoder, configuration.streamHasher), {
            step: "build",
            priority: 0,
            tags: { BODY_CHECKSUM: true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return DeleteObjectsCommand;
}());
exports.DeleteObjectsCommand = DeleteObjectsCommand;
//# sourceMappingURL=DeleteObjectsCommand.js.map

/***/ }),

/***/ 8672:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketAccelerateConfiguration_1 = __webpack_require__(69140);
var GetBucketAccelerateConfigurationCommand = /** @class */ (function () {
    function GetBucketAccelerateConfigurationCommand(input) {
        this.input = input;
        this.model = GetBucketAccelerateConfiguration_1.GetBucketAccelerateConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketAccelerateConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketAccelerateConfigurationCommand;
}());
exports.GetBucketAccelerateConfigurationCommand = GetBucketAccelerateConfigurationCommand;
//# sourceMappingURL=GetBucketAccelerateConfigurationCommand.js.map

/***/ }),

/***/ 11347:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketAcl_1 = __webpack_require__(6129);
var GetBucketAclCommand = /** @class */ (function () {
    function GetBucketAclCommand(input) {
        this.input = input;
        this.model = GetBucketAcl_1.GetBucketAcl;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketAclCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketAclCommand;
}());
exports.GetBucketAclCommand = GetBucketAclCommand;
//# sourceMappingURL=GetBucketAclCommand.js.map

/***/ }),

/***/ 93389:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketAnalyticsConfiguration_1 = __webpack_require__(16446);
var GetBucketAnalyticsConfigurationCommand = /** @class */ (function () {
    function GetBucketAnalyticsConfigurationCommand(input) {
        this.input = input;
        this.model = GetBucketAnalyticsConfiguration_1.GetBucketAnalyticsConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketAnalyticsConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketAnalyticsConfigurationCommand;
}());
exports.GetBucketAnalyticsConfigurationCommand = GetBucketAnalyticsConfigurationCommand;
//# sourceMappingURL=GetBucketAnalyticsConfigurationCommand.js.map

/***/ }),

/***/ 89450:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketCors_1 = __webpack_require__(60766);
var GetBucketCorsCommand = /** @class */ (function () {
    function GetBucketCorsCommand(input) {
        this.input = input;
        this.model = GetBucketCors_1.GetBucketCors;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketCorsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketCorsCommand;
}());
exports.GetBucketCorsCommand = GetBucketCorsCommand;
//# sourceMappingURL=GetBucketCorsCommand.js.map

/***/ }),

/***/ 7264:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketEncryption_1 = __webpack_require__(71215);
var GetBucketEncryptionCommand = /** @class */ (function () {
    function GetBucketEncryptionCommand(input) {
        this.input = input;
        this.model = GetBucketEncryption_1.GetBucketEncryption;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketEncryptionCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketEncryptionCommand;
}());
exports.GetBucketEncryptionCommand = GetBucketEncryptionCommand;
//# sourceMappingURL=GetBucketEncryptionCommand.js.map

/***/ }),

/***/ 10726:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketInventoryConfiguration_1 = __webpack_require__(83163);
var GetBucketInventoryConfigurationCommand = /** @class */ (function () {
    function GetBucketInventoryConfigurationCommand(input) {
        this.input = input;
        this.model = GetBucketInventoryConfiguration_1.GetBucketInventoryConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketInventoryConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketInventoryConfigurationCommand;
}());
exports.GetBucketInventoryConfigurationCommand = GetBucketInventoryConfigurationCommand;
//# sourceMappingURL=GetBucketInventoryConfigurationCommand.js.map

/***/ }),

/***/ 97622:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketLifecycle_1 = __webpack_require__(5706);
var GetBucketLifecycleCommand = /** @class */ (function () {
    function GetBucketLifecycleCommand(input) {
        this.input = input;
        this.model = GetBucketLifecycle_1.GetBucketLifecycle;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketLifecycleCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketLifecycleCommand;
}());
exports.GetBucketLifecycleCommand = GetBucketLifecycleCommand;
//# sourceMappingURL=GetBucketLifecycleCommand.js.map

/***/ }),

/***/ 30931:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketLifecycleConfiguration_1 = __webpack_require__(76803);
var GetBucketLifecycleConfigurationCommand = /** @class */ (function () {
    function GetBucketLifecycleConfigurationCommand(input) {
        this.input = input;
        this.model = GetBucketLifecycleConfiguration_1.GetBucketLifecycleConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketLifecycleConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketLifecycleConfigurationCommand;
}());
exports.GetBucketLifecycleConfigurationCommand = GetBucketLifecycleConfigurationCommand;
//# sourceMappingURL=GetBucketLifecycleConfigurationCommand.js.map

/***/ }),

/***/ 32459:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketLocation_1 = __webpack_require__(5719);
var GetBucketLocationCommand = /** @class */ (function () {
    function GetBucketLocationCommand(input) {
        this.input = input;
        this.model = GetBucketLocation_1.GetBucketLocation;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketLocationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketLocationCommand;
}());
exports.GetBucketLocationCommand = GetBucketLocationCommand;
//# sourceMappingURL=GetBucketLocationCommand.js.map

/***/ }),

/***/ 82039:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketLogging_1 = __webpack_require__(98760);
var GetBucketLoggingCommand = /** @class */ (function () {
    function GetBucketLoggingCommand(input) {
        this.input = input;
        this.model = GetBucketLogging_1.GetBucketLogging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketLoggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketLoggingCommand;
}());
exports.GetBucketLoggingCommand = GetBucketLoggingCommand;
//# sourceMappingURL=GetBucketLoggingCommand.js.map

/***/ }),

/***/ 14391:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketMetricsConfiguration_1 = __webpack_require__(49515);
var GetBucketMetricsConfigurationCommand = /** @class */ (function () {
    function GetBucketMetricsConfigurationCommand(input) {
        this.input = input;
        this.model = GetBucketMetricsConfiguration_1.GetBucketMetricsConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketMetricsConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketMetricsConfigurationCommand;
}());
exports.GetBucketMetricsConfigurationCommand = GetBucketMetricsConfigurationCommand;
//# sourceMappingURL=GetBucketMetricsConfigurationCommand.js.map

/***/ }),

/***/ 7645:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketNotification_1 = __webpack_require__(36755);
var GetBucketNotificationCommand = /** @class */ (function () {
    function GetBucketNotificationCommand(input) {
        this.input = input;
        this.model = GetBucketNotification_1.GetBucketNotification;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketNotificationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketNotificationCommand;
}());
exports.GetBucketNotificationCommand = GetBucketNotificationCommand;
//# sourceMappingURL=GetBucketNotificationCommand.js.map

/***/ }),

/***/ 11885:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketNotificationConfiguration_1 = __webpack_require__(88391);
var GetBucketNotificationConfigurationCommand = /** @class */ (function () {
    function GetBucketNotificationConfigurationCommand(input) {
        this.input = input;
        this.model = GetBucketNotificationConfiguration_1.GetBucketNotificationConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketNotificationConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketNotificationConfigurationCommand;
}());
exports.GetBucketNotificationConfigurationCommand = GetBucketNotificationConfigurationCommand;
//# sourceMappingURL=GetBucketNotificationConfigurationCommand.js.map

/***/ }),

/***/ 55051:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketPolicy_1 = __webpack_require__(7208);
var GetBucketPolicyCommand = /** @class */ (function () {
    function GetBucketPolicyCommand(input) {
        this.input = input;
        this.model = GetBucketPolicy_1.GetBucketPolicy;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketPolicyCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketPolicyCommand;
}());
exports.GetBucketPolicyCommand = GetBucketPolicyCommand;
//# sourceMappingURL=GetBucketPolicyCommand.js.map

/***/ }),

/***/ 10547:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketReplication_1 = __webpack_require__(92178);
var GetBucketReplicationCommand = /** @class */ (function () {
    function GetBucketReplicationCommand(input) {
        this.input = input;
        this.model = GetBucketReplication_1.GetBucketReplication;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketReplicationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketReplicationCommand;
}());
exports.GetBucketReplicationCommand = GetBucketReplicationCommand;
//# sourceMappingURL=GetBucketReplicationCommand.js.map

/***/ }),

/***/ 76044:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketRequestPayment_1 = __webpack_require__(65633);
var GetBucketRequestPaymentCommand = /** @class */ (function () {
    function GetBucketRequestPaymentCommand(input) {
        this.input = input;
        this.model = GetBucketRequestPayment_1.GetBucketRequestPayment;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketRequestPaymentCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketRequestPaymentCommand;
}());
exports.GetBucketRequestPaymentCommand = GetBucketRequestPaymentCommand;
//# sourceMappingURL=GetBucketRequestPaymentCommand.js.map

/***/ }),

/***/ 14721:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketTagging_1 = __webpack_require__(9760);
var GetBucketTaggingCommand = /** @class */ (function () {
    function GetBucketTaggingCommand(input) {
        this.input = input;
        this.model = GetBucketTagging_1.GetBucketTagging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketTaggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketTaggingCommand;
}());
exports.GetBucketTaggingCommand = GetBucketTaggingCommand;
//# sourceMappingURL=GetBucketTaggingCommand.js.map

/***/ }),

/***/ 99133:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketVersioning_1 = __webpack_require__(40050);
var GetBucketVersioningCommand = /** @class */ (function () {
    function GetBucketVersioningCommand(input) {
        this.input = input;
        this.model = GetBucketVersioning_1.GetBucketVersioning;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketVersioningCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketVersioningCommand;
}());
exports.GetBucketVersioningCommand = GetBucketVersioningCommand;
//# sourceMappingURL=GetBucketVersioningCommand.js.map

/***/ }),

/***/ 47543:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetBucketWebsite_1 = __webpack_require__(4040);
var GetBucketWebsiteCommand = /** @class */ (function () {
    function GetBucketWebsiteCommand(input) {
        this.input = input;
        this.model = GetBucketWebsite_1.GetBucketWebsite;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetBucketWebsiteCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetBucketWebsiteCommand;
}());
exports.GetBucketWebsiteCommand = GetBucketWebsiteCommand;
//# sourceMappingURL=GetBucketWebsiteCommand.js.map

/***/ }),

/***/ 71744:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetObjectAcl_1 = __webpack_require__(90580);
var GetObjectAclCommand = /** @class */ (function () {
    function GetObjectAclCommand(input) {
        this.input = input;
        this.model = GetObjectAcl_1.GetObjectAcl;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetObjectAclCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetObjectAclCommand;
}());
exports.GetObjectAclCommand = GetObjectAclCommand;
//# sourceMappingURL=GetObjectAclCommand.js.map

/***/ }),

/***/ 78242:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var GetObject_1 = __webpack_require__(96494);
var GetObjectCommand = /** @class */ (function () {
    function GetObjectCommand(input) {
        this.input = input;
        this.model = GetObject_1.GetObject;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetObjectCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetObjectCommand;
}());
exports.GetObjectCommand = GetObjectCommand;
//# sourceMappingURL=GetObjectCommand.js.map

/***/ }),

/***/ 32104:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetObjectTagging_1 = __webpack_require__(93721);
var GetObjectTaggingCommand = /** @class */ (function () {
    function GetObjectTaggingCommand(input) {
        this.input = input;
        this.model = GetObjectTagging_1.GetObjectTagging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetObjectTaggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetObjectTaggingCommand;
}());
exports.GetObjectTaggingCommand = GetObjectTaggingCommand;
//# sourceMappingURL=GetObjectTaggingCommand.js.map

/***/ }),

/***/ 85541:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var GetObjectTorrent_1 = __webpack_require__(56377);
var GetObjectTorrentCommand = /** @class */ (function () {
    function GetObjectTorrentCommand(input) {
        this.input = input;
        this.model = GetObjectTorrent_1.GetObjectTorrent;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    GetObjectTorrentCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return GetObjectTorrentCommand;
}());
exports.GetObjectTorrentCommand = GetObjectTorrentCommand;
//# sourceMappingURL=GetObjectTorrentCommand.js.map

/***/ }),

/***/ 26930:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var HeadBucket_1 = __webpack_require__(50595);
var HeadBucketCommand = /** @class */ (function () {
    function HeadBucketCommand(input) {
        this.input = input;
        this.model = HeadBucket_1.HeadBucket;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    HeadBucketCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return HeadBucketCommand;
}());
exports.HeadBucketCommand = HeadBucketCommand;
//# sourceMappingURL=HeadBucketCommand.js.map

/***/ }),

/***/ 4493:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var HeadObject_1 = __webpack_require__(31386);
var HeadObjectCommand = /** @class */ (function () {
    function HeadObjectCommand(input) {
        this.input = input;
        this.model = HeadObject_1.HeadObject;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    HeadObjectCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return HeadObjectCommand;
}());
exports.HeadObjectCommand = HeadObjectCommand;
//# sourceMappingURL=HeadObjectCommand.js.map

/***/ }),

/***/ 47879:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListBucketAnalyticsConfigurations_1 = __webpack_require__(24177);
var ListBucketAnalyticsConfigurationsCommand = /** @class */ (function () {
    function ListBucketAnalyticsConfigurationsCommand(input) {
        this.input = input;
        this.model = ListBucketAnalyticsConfigurations_1.ListBucketAnalyticsConfigurations;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListBucketAnalyticsConfigurationsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListBucketAnalyticsConfigurationsCommand;
}());
exports.ListBucketAnalyticsConfigurationsCommand = ListBucketAnalyticsConfigurationsCommand;
//# sourceMappingURL=ListBucketAnalyticsConfigurationsCommand.js.map

/***/ }),

/***/ 42335:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListBucketInventoryConfigurations_1 = __webpack_require__(73934);
var ListBucketInventoryConfigurationsCommand = /** @class */ (function () {
    function ListBucketInventoryConfigurationsCommand(input) {
        this.input = input;
        this.model = ListBucketInventoryConfigurations_1.ListBucketInventoryConfigurations;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListBucketInventoryConfigurationsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListBucketInventoryConfigurationsCommand;
}());
exports.ListBucketInventoryConfigurationsCommand = ListBucketInventoryConfigurationsCommand;
//# sourceMappingURL=ListBucketInventoryConfigurationsCommand.js.map

/***/ }),

/***/ 83107:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListBucketMetricsConfigurations_1 = __webpack_require__(4194);
var ListBucketMetricsConfigurationsCommand = /** @class */ (function () {
    function ListBucketMetricsConfigurationsCommand(input) {
        this.input = input;
        this.model = ListBucketMetricsConfigurations_1.ListBucketMetricsConfigurations;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListBucketMetricsConfigurationsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListBucketMetricsConfigurationsCommand;
}());
exports.ListBucketMetricsConfigurationsCommand = ListBucketMetricsConfigurationsCommand;
//# sourceMappingURL=ListBucketMetricsConfigurationsCommand.js.map

/***/ }),

/***/ 14705:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListBuckets_1 = __webpack_require__(27252);
var ListBucketsCommand = /** @class */ (function () {
    function ListBucketsCommand(input) {
        this.input = input;
        this.model = ListBuckets_1.ListBuckets;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListBucketsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListBucketsCommand;
}());
exports.ListBucketsCommand = ListBucketsCommand;
//# sourceMappingURL=ListBucketsCommand.js.map

/***/ }),

/***/ 54283:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListMultipartUploads_1 = __webpack_require__(39893);
var ListMultipartUploadsCommand = /** @class */ (function () {
    function ListMultipartUploadsCommand(input) {
        this.input = input;
        this.model = ListMultipartUploads_1.ListMultipartUploads;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListMultipartUploadsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListMultipartUploadsCommand;
}());
exports.ListMultipartUploadsCommand = ListMultipartUploadsCommand;
//# sourceMappingURL=ListMultipartUploadsCommand.js.map

/***/ }),

/***/ 76786:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListObjectVersions_1 = __webpack_require__(79762);
var ListObjectVersionsCommand = /** @class */ (function () {
    function ListObjectVersionsCommand(input) {
        this.input = input;
        this.model = ListObjectVersions_1.ListObjectVersions;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListObjectVersionsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListObjectVersionsCommand;
}());
exports.ListObjectVersionsCommand = ListObjectVersionsCommand;
//# sourceMappingURL=ListObjectVersionsCommand.js.map

/***/ }),

/***/ 11021:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListObjects_1 = __webpack_require__(59373);
var ListObjectsCommand = /** @class */ (function () {
    function ListObjectsCommand(input) {
        this.input = input;
        this.model = ListObjects_1.ListObjects;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListObjectsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListObjectsCommand;
}());
exports.ListObjectsCommand = ListObjectsCommand;
//# sourceMappingURL=ListObjectsCommand.js.map

/***/ }),

/***/ 46098:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListObjectsV2_1 = __webpack_require__(25285);
var ListObjectsV2Command = /** @class */ (function () {
    function ListObjectsV2Command(input) {
        this.input = input;
        this.model = ListObjectsV2_1.ListObjectsV2;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListObjectsV2Command.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListObjectsV2Command;
}());
exports.ListObjectsV2Command = ListObjectsV2Command;
//# sourceMappingURL=ListObjectsV2Command.js.map

/***/ }),

/***/ 69851:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var ListParts_1 = __webpack_require__(61574);
var ListPartsCommand = /** @class */ (function () {
    function ListPartsCommand(input) {
        this.input = input;
        this.model = ListParts_1.ListParts;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    ListPartsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_middleware_header_default.headerDefault({
            "Content-Type": "application/octet-stream"
        }), {
            step: "build",
            priority: -50,
            tags: { "Content-Type": true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return ListPartsCommand;
}());
exports.ListPartsCommand = ListPartsCommand;
//# sourceMappingURL=ListPartsCommand.js.map

/***/ }),

/***/ 16488:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketAccelerateConfiguration_1 = __webpack_require__(50644);
var PutBucketAccelerateConfigurationCommand = /** @class */ (function () {
    function PutBucketAccelerateConfigurationCommand(input) {
        this.input = input;
        this.model = PutBucketAccelerateConfiguration_1.PutBucketAccelerateConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketAccelerateConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketAccelerateConfigurationCommand;
}());
exports.PutBucketAccelerateConfigurationCommand = PutBucketAccelerateConfigurationCommand;
//# sourceMappingURL=PutBucketAccelerateConfigurationCommand.js.map

/***/ }),

/***/ 52835:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketAcl_1 = __webpack_require__(79611);
var PutBucketAclCommand = /** @class */ (function () {
    function PutBucketAclCommand(input) {
        this.input = input;
        this.model = PutBucketAcl_1.PutBucketAcl;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketAclCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketAclCommand;
}());
exports.PutBucketAclCommand = PutBucketAclCommand;
//# sourceMappingURL=PutBucketAclCommand.js.map

/***/ }),

/***/ 79573:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketAnalyticsConfiguration_1 = __webpack_require__(43421);
var PutBucketAnalyticsConfigurationCommand = /** @class */ (function () {
    function PutBucketAnalyticsConfigurationCommand(input) {
        this.input = input;
        this.model = PutBucketAnalyticsConfiguration_1.PutBucketAnalyticsConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketAnalyticsConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketAnalyticsConfigurationCommand;
}());
exports.PutBucketAnalyticsConfigurationCommand = PutBucketAnalyticsConfigurationCommand;
//# sourceMappingURL=PutBucketAnalyticsConfigurationCommand.js.map

/***/ }),

/***/ 47671:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_apply_body_checksum_middleware = __webpack_require__(68892);
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketCors_1 = __webpack_require__(83341);
var PutBucketCorsCommand = /** @class */ (function () {
    function PutBucketCorsCommand(input) {
        this.input = input;
        this.model = PutBucketCors_1.PutBucketCors;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketCorsCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_apply_body_checksum_middleware.applyBodyChecksumMiddleware("Content-MD5", configuration.md5, configuration.base64Encoder, configuration.streamHasher), {
            step: "build",
            priority: 0,
            tags: { BODY_CHECKSUM: true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketCorsCommand;
}());
exports.PutBucketCorsCommand = PutBucketCorsCommand;
//# sourceMappingURL=PutBucketCorsCommand.js.map

/***/ }),

/***/ 88138:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketEncryption_1 = __webpack_require__(96599);
var PutBucketEncryptionCommand = /** @class */ (function () {
    function PutBucketEncryptionCommand(input) {
        this.input = input;
        this.model = PutBucketEncryption_1.PutBucketEncryption;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketEncryptionCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketEncryptionCommand;
}());
exports.PutBucketEncryptionCommand = PutBucketEncryptionCommand;
//# sourceMappingURL=PutBucketEncryptionCommand.js.map

/***/ }),

/***/ 11979:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketInventoryConfiguration_1 = __webpack_require__(13225);
var PutBucketInventoryConfigurationCommand = /** @class */ (function () {
    function PutBucketInventoryConfigurationCommand(input) {
        this.input = input;
        this.model = PutBucketInventoryConfiguration_1.PutBucketInventoryConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketInventoryConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketInventoryConfigurationCommand;
}());
exports.PutBucketInventoryConfigurationCommand = PutBucketInventoryConfigurationCommand;
//# sourceMappingURL=PutBucketInventoryConfigurationCommand.js.map

/***/ }),

/***/ 42831:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_apply_body_checksum_middleware = __webpack_require__(68892);
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketLifecycle_1 = __webpack_require__(99870);
var PutBucketLifecycleCommand = /** @class */ (function () {
    function PutBucketLifecycleCommand(input) {
        this.input = input;
        this.model = PutBucketLifecycle_1.PutBucketLifecycle;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketLifecycleCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_apply_body_checksum_middleware.applyBodyChecksumMiddleware("Content-MD5", configuration.md5, configuration.base64Encoder, configuration.streamHasher), {
            step: "build",
            priority: 0,
            tags: { BODY_CHECKSUM: true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketLifecycleCommand;
}());
exports.PutBucketLifecycleCommand = PutBucketLifecycleCommand;
//# sourceMappingURL=PutBucketLifecycleCommand.js.map

/***/ }),

/***/ 6642:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_apply_body_checksum_middleware = __webpack_require__(68892);
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketLifecycleConfiguration_1 = __webpack_require__(29695);
var PutBucketLifecycleConfigurationCommand = /** @class */ (function () {
    function PutBucketLifecycleConfigurationCommand(input) {
        this.input = input;
        this.model = PutBucketLifecycleConfiguration_1.PutBucketLifecycleConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketLifecycleConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_apply_body_checksum_middleware.applyBodyChecksumMiddleware("Content-MD5", configuration.md5, configuration.base64Encoder, configuration.streamHasher), {
            step: "build",
            priority: 0,
            tags: { BODY_CHECKSUM: true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketLifecycleConfigurationCommand;
}());
exports.PutBucketLifecycleConfigurationCommand = PutBucketLifecycleConfigurationCommand;
//# sourceMappingURL=PutBucketLifecycleConfigurationCommand.js.map

/***/ }),

/***/ 64732:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketLogging_1 = __webpack_require__(82458);
var PutBucketLoggingCommand = /** @class */ (function () {
    function PutBucketLoggingCommand(input) {
        this.input = input;
        this.model = PutBucketLogging_1.PutBucketLogging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketLoggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketLoggingCommand;
}());
exports.PutBucketLoggingCommand = PutBucketLoggingCommand;
//# sourceMappingURL=PutBucketLoggingCommand.js.map

/***/ }),

/***/ 66294:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketMetricsConfiguration_1 = __webpack_require__(61098);
var PutBucketMetricsConfigurationCommand = /** @class */ (function () {
    function PutBucketMetricsConfigurationCommand(input) {
        this.input = input;
        this.model = PutBucketMetricsConfiguration_1.PutBucketMetricsConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketMetricsConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketMetricsConfigurationCommand;
}());
exports.PutBucketMetricsConfigurationCommand = PutBucketMetricsConfigurationCommand;
//# sourceMappingURL=PutBucketMetricsConfigurationCommand.js.map

/***/ }),

/***/ 16837:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketNotification_1 = __webpack_require__(2757);
var PutBucketNotificationCommand = /** @class */ (function () {
    function PutBucketNotificationCommand(input) {
        this.input = input;
        this.model = PutBucketNotification_1.PutBucketNotification;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketNotificationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketNotificationCommand;
}());
exports.PutBucketNotificationCommand = PutBucketNotificationCommand;
//# sourceMappingURL=PutBucketNotificationCommand.js.map

/***/ }),

/***/ 61430:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketNotificationConfiguration_1 = __webpack_require__(33673);
var PutBucketNotificationConfigurationCommand = /** @class */ (function () {
    function PutBucketNotificationConfigurationCommand(input) {
        this.input = input;
        this.model = PutBucketNotificationConfiguration_1.PutBucketNotificationConfiguration;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketNotificationConfigurationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketNotificationConfigurationCommand;
}());
exports.PutBucketNotificationConfigurationCommand = PutBucketNotificationConfigurationCommand;
//# sourceMappingURL=PutBucketNotificationConfigurationCommand.js.map

/***/ }),

/***/ 39048:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_apply_body_checksum_middleware = __webpack_require__(68892);
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketPolicy_1 = __webpack_require__(86115);
var PutBucketPolicyCommand = /** @class */ (function () {
    function PutBucketPolicyCommand(input) {
        this.input = input;
        this.model = PutBucketPolicy_1.PutBucketPolicy;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketPolicyCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_apply_body_checksum_middleware.applyBodyChecksumMiddleware("Content-MD5", configuration.md5, configuration.base64Encoder, configuration.streamHasher), {
            step: "build",
            priority: 0,
            tags: { BODY_CHECKSUM: true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketPolicyCommand;
}());
exports.PutBucketPolicyCommand = PutBucketPolicyCommand;
//# sourceMappingURL=PutBucketPolicyCommand.js.map

/***/ }),

/***/ 44288:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_apply_body_checksum_middleware = __webpack_require__(68892);
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketReplication_1 = __webpack_require__(48734);
var PutBucketReplicationCommand = /** @class */ (function () {
    function PutBucketReplicationCommand(input) {
        this.input = input;
        this.model = PutBucketReplication_1.PutBucketReplication;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketReplicationCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_apply_body_checksum_middleware.applyBodyChecksumMiddleware("Content-MD5", configuration.md5, configuration.base64Encoder, configuration.streamHasher), {
            step: "build",
            priority: 0,
            tags: { BODY_CHECKSUM: true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketReplicationCommand;
}());
exports.PutBucketReplicationCommand = PutBucketReplicationCommand;
//# sourceMappingURL=PutBucketReplicationCommand.js.map

/***/ }),

/***/ 43133:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketRequestPayment_1 = __webpack_require__(12870);
var PutBucketRequestPaymentCommand = /** @class */ (function () {
    function PutBucketRequestPaymentCommand(input) {
        this.input = input;
        this.model = PutBucketRequestPayment_1.PutBucketRequestPayment;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketRequestPaymentCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketRequestPaymentCommand;
}());
exports.PutBucketRequestPaymentCommand = PutBucketRequestPaymentCommand;
//# sourceMappingURL=PutBucketRequestPaymentCommand.js.map

/***/ }),

/***/ 68940:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_apply_body_checksum_middleware = __webpack_require__(68892);
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketTagging_1 = __webpack_require__(7863);
var PutBucketTaggingCommand = /** @class */ (function () {
    function PutBucketTaggingCommand(input) {
        this.input = input;
        this.model = PutBucketTagging_1.PutBucketTagging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketTaggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_apply_body_checksum_middleware.applyBodyChecksumMiddleware("Content-MD5", configuration.md5, configuration.base64Encoder, configuration.streamHasher), {
            step: "build",
            priority: 0,
            tags: { BODY_CHECKSUM: true }
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketTaggingCommand;
}());
exports.PutBucketTaggingCommand = PutBucketTaggingCommand;
//# sourceMappingURL=PutBucketTaggingCommand.js.map

/***/ }),

/***/ 56047:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketVersioning_1 = __webpack_require__(87436);
var PutBucketVersioningCommand = /** @class */ (function () {
    function PutBucketVersioningCommand(input) {
        this.input = input;
        this.model = PutBucketVersioning_1.PutBucketVersioning;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketVersioningCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketVersioningCommand;
}());
exports.PutBucketVersioningCommand = PutBucketVersioningCommand;
//# sourceMappingURL=PutBucketVersioningCommand.js.map

/***/ }),

/***/ 22491:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutBucketWebsite_1 = __webpack_require__(14757);
var PutBucketWebsiteCommand = /** @class */ (function () {
    function PutBucketWebsiteCommand(input) {
        this.input = input;
        this.model = PutBucketWebsite_1.PutBucketWebsite;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutBucketWebsiteCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutBucketWebsiteCommand;
}());
exports.PutBucketWebsiteCommand = PutBucketWebsiteCommand;
//# sourceMappingURL=PutBucketWebsiteCommand.js.map

/***/ }),

/***/ 52769:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutObjectAcl_1 = __webpack_require__(30691);
var PutObjectAclCommand = /** @class */ (function () {
    function PutObjectAclCommand(input) {
        this.input = input;
        this.model = PutObjectAcl_1.PutObjectAcl;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutObjectAclCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutObjectAclCommand;
}());
exports.PutObjectAclCommand = PutObjectAclCommand;
//# sourceMappingURL=PutObjectAclCommand.js.map

/***/ }),

/***/ 75007:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var PutObject_1 = __webpack_require__(96770);
var PutObjectCommand = /** @class */ (function () {
    function PutObjectCommand(input) {
        this.input = input;
        this.model = PutObject_1.PutObject;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutObjectCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        if (configuration.disableBodySigning) {
            stack.add(__aws_sdk_middleware_header_default.headerDefault({
                "x-amz-content-sha256": "UNSIGNED-PAYLOAD"
            }), {
                step: "build",
                priority: 100,
                tags: { BODY_CHECKSUM: true, UNSIGNED_PAYLOAD: true }
            });
        }
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutObjectCommand;
}());
exports.PutObjectCommand = PutObjectCommand;
//# sourceMappingURL=PutObjectCommand.js.map

/***/ }),

/***/ 73377:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var PutObjectTagging_1 = __webpack_require__(33987);
var PutObjectTaggingCommand = /** @class */ (function () {
    function PutObjectTaggingCommand(input) {
        this.input = input;
        this.model = PutObjectTagging_1.PutObjectTagging;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    PutObjectTaggingCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return PutObjectTaggingCommand;
}());
exports.PutObjectTaggingCommand = PutObjectTaggingCommand;
//# sourceMappingURL=PutObjectTaggingCommand.js.map

/***/ }),

/***/ 50613:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var RestoreObject_1 = __webpack_require__(31488);
var RestoreObjectCommand = /** @class */ (function () {
    function RestoreObjectCommand(input) {
        this.input = input;
        this.model = RestoreObject_1.RestoreObject;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    RestoreObjectCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return RestoreObjectCommand;
}());
exports.RestoreObjectCommand = RestoreObjectCommand;
//# sourceMappingURL=RestoreObjectCommand.js.map

/***/ }),

/***/ 71476:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var SelectObjectContent_1 = __webpack_require__(91223);
var SelectObjectContentCommand = /** @class */ (function () {
    function SelectObjectContentCommand(input) {
        this.input = input;
        this.model = SelectObjectContent_1.SelectObjectContent;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    SelectObjectContentCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return SelectObjectContentCommand;
}());
exports.SelectObjectContentCommand = SelectObjectContentCommand;
//# sourceMappingURL=SelectObjectContentCommand.js.map

/***/ }),

/***/ 1946:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_header_default = __webpack_require__(26385);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var UploadPart_1 = __webpack_require__(27777);
var UploadPartCommand = /** @class */ (function () {
    function UploadPartCommand(input) {
        this.input = input;
        this.model = UploadPart_1.UploadPart;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    UploadPartCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        if (configuration.disableBodySigning) {
            stack.add(__aws_sdk_middleware_header_default.headerDefault({
                "x-amz-content-sha256": "UNSIGNED-PAYLOAD"
            }), {
                step: "build",
                priority: 100,
                tags: { BODY_CHECKSUM: true, UNSIGNED_PAYLOAD: true }
            });
        }
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return UploadPartCommand;
}());
exports.UploadPartCommand = UploadPartCommand;
//# sourceMappingURL=UploadPartCommand.js.map

/***/ }),

/***/ 67354:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var __aws_sdk_bucket_endpoint_middleware = __webpack_require__(32829);
var __aws_sdk_middleware_stack = __webpack_require__(7936);
var __aws_sdk_ssec_middleware = __webpack_require__(17845);
var UploadPartCopy_1 = __webpack_require__(71869);
var UploadPartCopyCommand = /** @class */ (function () {
    function UploadPartCopyCommand(input) {
        this.input = input;
        this.model = UploadPartCopy_1.UploadPartCopy;
        this.middlewareStack = new __aws_sdk_middleware_stack.MiddlewareStack();
    }
    UploadPartCopyCommand.prototype.resolveMiddleware = function (clientStack, configuration) {
        var handler = configuration.handler;
        var stack = clientStack.concat(this.middlewareStack);
        var handlerExecutionContext = {
            logger: {},
            model: this.model
        };
        stack.add(__aws_sdk_bucket_endpoint_middleware.bucketEndpointMiddleware({
            forcePathStyle: configuration.forcePathStyle,
            preformedBucketEndpoint: configuration.bucketEndpoint,
            useAccelerateEndpoint: configuration.useAccelerateEndpoint,
            useDualstackEndpoint: configuration.useDualstackEndpoint
        }), {
            step: "build",
            priority: 0
        });
        stack.add(__aws_sdk_ssec_middleware.ssecMiddleware({
            base64Encoder: configuration.base64Encoder,
            hashConstructor: configuration.md5,
            ssecProperties: {
                $serverSideEncryptionKey: {
                    targetProperty: "SSECustomerKey",
                    hashTargetProperty: "SSECustomerKeyMD5"
                },
                $copySourceServerSideEncryptionKey: {
                    targetProperty: "CopySourceSSECustomerKey",
                    hashTargetProperty: "CopySourceSSECustomerKeyMD5"
                }
            },
            utf8Decoder: configuration.utf8Decoder
        }), {
            step: "initialize",
            priority: 0
        });
        return stack.resolve(handler(handlerExecutionContext), handlerExecutionContext);
    };
    return UploadPartCopyCommand;
}());
exports.UploadPartCopyCommand = UploadPartCopyCommand;
//# sourceMappingURL=UploadPartCopyCommand.js.map

/***/ }),

/***/ 39960:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(8833), exports);
tslib_1.__exportStar(__webpack_require__(1525), exports);
tslib_1.__exportStar(__webpack_require__(85117), exports);
tslib_1.__exportStar(__webpack_require__(30455), exports);
tslib_1.__exportStar(__webpack_require__(39952), exports);
tslib_1.__exportStar(__webpack_require__(8842), exports);
tslib_1.__exportStar(__webpack_require__(41886), exports);
tslib_1.__exportStar(__webpack_require__(97899), exports);
tslib_1.__exportStar(__webpack_require__(81629), exports);
tslib_1.__exportStar(__webpack_require__(1295), exports);
tslib_1.__exportStar(__webpack_require__(7682), exports);
tslib_1.__exportStar(__webpack_require__(79727), exports);
tslib_1.__exportStar(__webpack_require__(46927), exports);
tslib_1.__exportStar(__webpack_require__(95010), exports);
tslib_1.__exportStar(__webpack_require__(86030), exports);
tslib_1.__exportStar(__webpack_require__(58774), exports);
tslib_1.__exportStar(__webpack_require__(33723), exports);
tslib_1.__exportStar(__webpack_require__(53827), exports);
tslib_1.__exportStar(__webpack_require__(89521), exports);
tslib_1.__exportStar(__webpack_require__(27864), exports);
tslib_1.__exportStar(__webpack_require__(89978), exports);
tslib_1.__exportStar(__webpack_require__(74256), exports);
tslib_1.__exportStar(__webpack_require__(8672), exports);
tslib_1.__exportStar(__webpack_require__(11347), exports);
tslib_1.__exportStar(__webpack_require__(93389), exports);
tslib_1.__exportStar(__webpack_require__(89450), exports);
tslib_1.__exportStar(__webpack_require__(7264), exports);
tslib_1.__exportStar(__webpack_require__(10726), exports);
tslib_1.__exportStar(__webpack_require__(97622), exports);
tslib_1.__exportStar(__webpack_require__(30931), exports);
tslib_1.__exportStar(__webpack_require__(32459), exports);
tslib_1.__exportStar(__webpack_require__(82039), exports);
tslib_1.__exportStar(__webpack_require__(14391), exports);
tslib_1.__exportStar(__webpack_require__(7645), exports);
tslib_1.__exportStar(__webpack_require__(11885), exports);
tslib_1.__exportStar(__webpack_require__(55051), exports);
tslib_1.__exportStar(__webpack_require__(10547), exports);
tslib_1.__exportStar(__webpack_require__(76044), exports);
tslib_1.__exportStar(__webpack_require__(14721), exports);
tslib_1.__exportStar(__webpack_require__(99133), exports);
tslib_1.__exportStar(__webpack_require__(47543), exports);
tslib_1.__exportStar(__webpack_require__(78242), exports);
tslib_1.__exportStar(__webpack_require__(71744), exports);
tslib_1.__exportStar(__webpack_require__(32104), exports);
tslib_1.__exportStar(__webpack_require__(85541), exports);
tslib_1.__exportStar(__webpack_require__(26930), exports);
tslib_1.__exportStar(__webpack_require__(4493), exports);
tslib_1.__exportStar(__webpack_require__(47879), exports);
tslib_1.__exportStar(__webpack_require__(42335), exports);
tslib_1.__exportStar(__webpack_require__(83107), exports);
tslib_1.__exportStar(__webpack_require__(14705), exports);
tslib_1.__exportStar(__webpack_require__(54283), exports);
tslib_1.__exportStar(__webpack_require__(76786), exports);
tslib_1.__exportStar(__webpack_require__(11021), exports);
tslib_1.__exportStar(__webpack_require__(46098), exports);
tslib_1.__exportStar(__webpack_require__(69851), exports);
tslib_1.__exportStar(__webpack_require__(16488), exports);
tslib_1.__exportStar(__webpack_require__(52835), exports);
tslib_1.__exportStar(__webpack_require__(79573), exports);
tslib_1.__exportStar(__webpack_require__(47671), exports);
tslib_1.__exportStar(__webpack_require__(88138), exports);
tslib_1.__exportStar(__webpack_require__(11979), exports);
tslib_1.__exportStar(__webpack_require__(42831), exports);
tslib_1.__exportStar(__webpack_require__(6642), exports);
tslib_1.__exportStar(__webpack_require__(64732), exports);
tslib_1.__exportStar(__webpack_require__(66294), exports);
tslib_1.__exportStar(__webpack_require__(16837), exports);
tslib_1.__exportStar(__webpack_require__(61430), exports);
tslib_1.__exportStar(__webpack_require__(39048), exports);
tslib_1.__exportStar(__webpack_require__(44288), exports);
tslib_1.__exportStar(__webpack_require__(43133), exports);
tslib_1.__exportStar(__webpack_require__(68940), exports);
tslib_1.__exportStar(__webpack_require__(56047), exports);
tslib_1.__exportStar(__webpack_require__(22491), exports);
tslib_1.__exportStar(__webpack_require__(75007), exports);
tslib_1.__exportStar(__webpack_require__(52769), exports);
tslib_1.__exportStar(__webpack_require__(73377), exports);
tslib_1.__exportStar(__webpack_require__(50613), exports);
tslib_1.__exportStar(__webpack_require__(71476), exports);
tslib_1.__exportStar(__webpack_require__(1946), exports);
tslib_1.__exportStar(__webpack_require__(67354), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 59723:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var AbortMultipartUploadInput_1 = __webpack_require__(30225);
var AbortMultipartUploadOutput_1 = __webpack_require__(68378);
var NoSuchUpload_1 = __webpack_require__(18528);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.AbortMultipartUpload = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "AbortMultipartUpload",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: AbortMultipartUploadInput_1.AbortMultipartUploadInput
    },
    output: {
        shape: AbortMultipartUploadOutput_1.AbortMultipartUploadOutput
    },
    errors: [
        {
            shape: NoSuchUpload_1.NoSuchUpload
        }
    ]
};
//# sourceMappingURL=AbortMultipartUpload.js.map

/***/ }),

/***/ 30225:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbortMultipartUploadInput = {
    type: "structure",
    required: ["Bucket", "Key", "UploadId"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        UploadId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "uploadId"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=AbortMultipartUploadInput.js.map

/***/ }),

/***/ 68378:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AbortMultipartUploadOutput = {
    type: "structure",
    required: [],
    members: {
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=AbortMultipartUploadOutput.js.map

/***/ }),

/***/ 70440:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BucketAlreadyExists = {
    type: "structure",
    required: [],
    members: {},
    exceptionType: "BucketAlreadyExists"
};
//# sourceMappingURL=BucketAlreadyExists.js.map

/***/ }),

/***/ 70944:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BucketAlreadyOwnedByYou = {
    type: "structure",
    required: [],
    members: {},
    exceptionType: "BucketAlreadyOwnedByYou"
};
//# sourceMappingURL=BucketAlreadyOwnedByYou.js.map

/***/ }),

/***/ 79332:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var CompleteMultipartUploadInput_1 = __webpack_require__(61909);
var CompleteMultipartUploadOutput_1 = __webpack_require__(34237);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.CompleteMultipartUpload = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "CompleteMultipartUpload",
    http: {
        method: "POST",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: CompleteMultipartUploadInput_1.CompleteMultipartUploadInput
    },
    output: {
        shape: CompleteMultipartUploadOutput_1.CompleteMultipartUploadOutput
    },
    errors: []
};
//# sourceMappingURL=CompleteMultipartUpload.js.map

/***/ }),

/***/ 61909:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CompletedMultipartUpload_1 = __webpack_require__(71853);
exports.CompleteMultipartUploadInput = {
    type: "structure",
    required: ["Bucket", "Key", "UploadId"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        MultipartUpload: {
            shape: _CompletedMultipartUpload_1._CompletedMultipartUpload,
            locationName: "CompleteMultipartUpload",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        UploadId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "uploadId"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    },
    payload: "MultipartUpload"
};
//# sourceMappingURL=CompleteMultipartUploadInput.js.map

/***/ }),

/***/ 34237:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CompleteMultipartUploadOutput = {
    type: "structure",
    required: [],
    members: {
        Location: {
            shape: {
                type: "string"
            }
        },
        Bucket: {
            shape: {
                type: "string"
            }
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        Expiration: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-expiration"
        },
        ETag: {
            shape: {
                type: "string"
            }
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=CompleteMultipartUploadOutput.js.map

/***/ }),

/***/ 50134:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var CopyObjectInput_1 = __webpack_require__(61342);
var CopyObjectOutput_1 = __webpack_require__(52990);
var ObjectNotInActiveTierError_1 = __webpack_require__(99075);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.CopyObject = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "CopyObject",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: CopyObjectInput_1.CopyObjectInput
    },
    output: {
        shape: CopyObjectOutput_1.CopyObjectOutput
    },
    errors: [
        {
            shape: ObjectNotInActiveTierError_1.ObjectNotInActiveTierError
        }
    ]
};
//# sourceMappingURL=CopyObject.js.map

/***/ }),

/***/ 61342:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Metadata_1 = __webpack_require__(43941);
exports.CopyObjectInput = {
    type: "structure",
    required: ["Bucket", "CopySource", "Key"],
    members: {
        ACL: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-acl"
        },
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        CacheControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Cache-Control"
        },
        ContentDisposition: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Disposition"
        },
        ContentEncoding: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Encoding"
        },
        ContentLanguage: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Language"
        },
        ContentType: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Type"
        },
        CopySource: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source"
        },
        CopySourceIfMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-match"
        },
        CopySourceIfModifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-modified-since"
        },
        CopySourceIfNoneMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-none-match"
        },
        CopySourceIfUnmodifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-unmodified-since"
        },
        Expires: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "Expires"
        },
        GrantFullControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-full-control"
        },
        GrantRead: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read"
        },
        GrantReadACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read-acp"
        },
        GrantWriteACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write-acp"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        Metadata: {
            shape: _Metadata_1._Metadata,
            location: "headers",
            locationName: "x-amz-meta-"
        },
        MetadataDirective: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-metadata-directive"
        },
        TaggingDirective: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-tagging-directive"
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        StorageClass: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-storage-class"
        },
        WebsiteRedirectLocation: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-website-redirect-location"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        CopySourceSSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-server-side-encryption-customer-algorithm"
        },
        CopySourceSSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-copy-source-server-side-encryption-customer-key"
        },
        CopySourceSSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-server-side-encryption-customer-key-MD5"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        },
        Tagging: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-tagging"
        }
    }
};
//# sourceMappingURL=CopyObjectInput.js.map

/***/ }),

/***/ 52990:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CopyObjectResult_1 = __webpack_require__(54802);
exports.CopyObjectOutput = {
    type: "structure",
    required: [],
    members: {
        CopyObjectResult: {
            shape: _CopyObjectResult_1._CopyObjectResult
        },
        Expiration: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-expiration"
        },
        CopySourceVersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-version-id"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    },
    payload: "CopyObjectResult"
};
//# sourceMappingURL=CopyObjectOutput.js.map

/***/ }),

/***/ 93289:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var CreateBucketInput_1 = __webpack_require__(99818);
var CreateBucketOutput_1 = __webpack_require__(62272);
var BucketAlreadyExists_1 = __webpack_require__(70440);
var BucketAlreadyOwnedByYou_1 = __webpack_require__(70944);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.CreateBucket = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "CreateBucket",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}"
    },
    input: {
        shape: CreateBucketInput_1.CreateBucketInput
    },
    output: {
        shape: CreateBucketOutput_1.CreateBucketOutput
    },
    errors: [
        {
            shape: BucketAlreadyExists_1.BucketAlreadyExists
        },
        {
            shape: BucketAlreadyOwnedByYou_1.BucketAlreadyOwnedByYou
        }
    ]
};
//# sourceMappingURL=CreateBucket.js.map

/***/ }),

/***/ 99818:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CreateBucketConfiguration_1 = __webpack_require__(17053);
exports.CreateBucketInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        ACL: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-acl"
        },
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        CreateBucketConfiguration: {
            shape: _CreateBucketConfiguration_1._CreateBucketConfiguration,
            locationName: "CreateBucketConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        GrantFullControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-full-control"
        },
        GrantRead: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read"
        },
        GrantReadACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read-acp"
        },
        GrantWrite: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write"
        },
        GrantWriteACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write-acp"
        }
    },
    payload: "CreateBucketConfiguration"
};
//# sourceMappingURL=CreateBucketInput.js.map

/***/ }),

/***/ 62272:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateBucketOutput = {
    type: "structure",
    required: [],
    members: {
        Location: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Location"
        }
    }
};
//# sourceMappingURL=CreateBucketOutput.js.map

/***/ }),

/***/ 41632:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var CreateMultipartUploadInput_1 = __webpack_require__(13966);
var CreateMultipartUploadOutput_1 = __webpack_require__(22320);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.CreateMultipartUpload = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "CreateMultipartUpload",
    http: {
        method: "POST",
        requestUri: "/{Bucket}/{Key+}?uploads"
    },
    input: {
        shape: CreateMultipartUploadInput_1.CreateMultipartUploadInput
    },
    output: {
        shape: CreateMultipartUploadOutput_1.CreateMultipartUploadOutput
    },
    errors: []
};
//# sourceMappingURL=CreateMultipartUpload.js.map

/***/ }),

/***/ 13966:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Metadata_1 = __webpack_require__(43941);
exports.CreateMultipartUploadInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        ACL: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-acl"
        },
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        CacheControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Cache-Control"
        },
        ContentDisposition: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Disposition"
        },
        ContentEncoding: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Encoding"
        },
        ContentLanguage: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Language"
        },
        ContentType: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Type"
        },
        Expires: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "Expires"
        },
        GrantFullControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-full-control"
        },
        GrantRead: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read"
        },
        GrantReadACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read-acp"
        },
        GrantWriteACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write-acp"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        Metadata: {
            shape: _Metadata_1._Metadata,
            location: "headers",
            locationName: "x-amz-meta-"
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        StorageClass: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-storage-class"
        },
        WebsiteRedirectLocation: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-website-redirect-location"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        },
        Tagging: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-tagging"
        }
    }
};
//# sourceMappingURL=CreateMultipartUploadInput.js.map

/***/ }),

/***/ 22320:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CreateMultipartUploadOutput = {
    type: "structure",
    required: [],
    members: {
        AbortDate: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "x-amz-abort-date"
        },
        AbortRuleId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-abort-rule-id"
        },
        Bucket: {
            shape: {
                type: "string"
            },
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        UploadId: {
            shape: {
                type: "string"
            }
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=CreateMultipartUploadOutput.js.map

/***/ }),

/***/ 56150:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketInput_1 = __webpack_require__(34246);
var DeleteBucketOutput_1 = __webpack_require__(66515);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucket = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucket",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}"
    },
    input: {
        shape: DeleteBucketInput_1.DeleteBucketInput
    },
    output: {
        shape: DeleteBucketOutput_1.DeleteBucketOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucket.js.map

/***/ }),

/***/ 22951:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketAnalyticsConfigurationInput_1 = __webpack_require__(48924);
var DeleteBucketAnalyticsConfigurationOutput_1 = __webpack_require__(29112);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketAnalyticsConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketAnalyticsConfiguration",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?analytics"
    },
    input: {
        shape: DeleteBucketAnalyticsConfigurationInput_1.DeleteBucketAnalyticsConfigurationInput
    },
    output: {
        shape: DeleteBucketAnalyticsConfigurationOutput_1.DeleteBucketAnalyticsConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketAnalyticsConfiguration.js.map

/***/ }),

/***/ 48924:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketAnalyticsConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        }
    }
};
//# sourceMappingURL=DeleteBucketAnalyticsConfigurationInput.js.map

/***/ }),

/***/ 29112:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketAnalyticsConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketAnalyticsConfigurationOutput.js.map

/***/ }),

/***/ 20486:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketCorsInput_1 = __webpack_require__(43585);
var DeleteBucketCorsOutput_1 = __webpack_require__(65514);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketCors = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketCors",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?cors"
    },
    input: {
        shape: DeleteBucketCorsInput_1.DeleteBucketCorsInput
    },
    output: {
        shape: DeleteBucketCorsOutput_1.DeleteBucketCorsOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketCors.js.map

/***/ }),

/***/ 43585:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketCorsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketCorsInput.js.map

/***/ }),

/***/ 65514:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketCorsOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketCorsOutput.js.map

/***/ }),

/***/ 79423:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketEncryptionInput_1 = __webpack_require__(68893);
var DeleteBucketEncryptionOutput_1 = __webpack_require__(38111);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketEncryption = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketEncryption",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?encryption"
    },
    input: {
        shape: DeleteBucketEncryptionInput_1.DeleteBucketEncryptionInput
    },
    output: {
        shape: DeleteBucketEncryptionOutput_1.DeleteBucketEncryptionOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketEncryption.js.map

/***/ }),

/***/ 68893:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketEncryptionInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketEncryptionInput.js.map

/***/ }),

/***/ 38111:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketEncryptionOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketEncryptionOutput.js.map

/***/ }),

/***/ 34246:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketInput.js.map

/***/ }),

/***/ 72409:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketInventoryConfigurationInput_1 = __webpack_require__(79548);
var DeleteBucketInventoryConfigurationOutput_1 = __webpack_require__(62112);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketInventoryConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketInventoryConfiguration",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?inventory"
    },
    input: {
        shape: DeleteBucketInventoryConfigurationInput_1.DeleteBucketInventoryConfigurationInput
    },
    output: {
        shape: DeleteBucketInventoryConfigurationOutput_1.DeleteBucketInventoryConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketInventoryConfiguration.js.map

/***/ }),

/***/ 79548:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketInventoryConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        }
    }
};
//# sourceMappingURL=DeleteBucketInventoryConfigurationInput.js.map

/***/ }),

/***/ 62112:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketInventoryConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketInventoryConfigurationOutput.js.map

/***/ }),

/***/ 16284:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketLifecycleInput_1 = __webpack_require__(62599);
var DeleteBucketLifecycleOutput_1 = __webpack_require__(52727);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketLifecycle = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketLifecycle",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?lifecycle"
    },
    input: {
        shape: DeleteBucketLifecycleInput_1.DeleteBucketLifecycleInput
    },
    output: {
        shape: DeleteBucketLifecycleOutput_1.DeleteBucketLifecycleOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketLifecycle.js.map

/***/ }),

/***/ 62599:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketLifecycleInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketLifecycleInput.js.map

/***/ }),

/***/ 52727:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketLifecycleOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketLifecycleOutput.js.map

/***/ }),

/***/ 93291:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketMetricsConfigurationInput_1 = __webpack_require__(39542);
var DeleteBucketMetricsConfigurationOutput_1 = __webpack_require__(4204);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketMetricsConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketMetricsConfiguration",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?metrics"
    },
    input: {
        shape: DeleteBucketMetricsConfigurationInput_1.DeleteBucketMetricsConfigurationInput
    },
    output: {
        shape: DeleteBucketMetricsConfigurationOutput_1.DeleteBucketMetricsConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketMetricsConfiguration.js.map

/***/ }),

/***/ 39542:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketMetricsConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        }
    }
};
//# sourceMappingURL=DeleteBucketMetricsConfigurationInput.js.map

/***/ }),

/***/ 4204:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketMetricsConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketMetricsConfigurationOutput.js.map

/***/ }),

/***/ 66515:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketOutput.js.map

/***/ }),

/***/ 97383:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketPolicyInput_1 = __webpack_require__(80553);
var DeleteBucketPolicyOutput_1 = __webpack_require__(88272);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketPolicy = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketPolicy",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?policy"
    },
    input: {
        shape: DeleteBucketPolicyInput_1.DeleteBucketPolicyInput
    },
    output: {
        shape: DeleteBucketPolicyOutput_1.DeleteBucketPolicyOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketPolicy.js.map

/***/ }),

/***/ 80553:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketPolicyInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketPolicyInput.js.map

/***/ }),

/***/ 88272:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketPolicyOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketPolicyOutput.js.map

/***/ }),

/***/ 43537:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketReplicationInput_1 = __webpack_require__(98141);
var DeleteBucketReplicationOutput_1 = __webpack_require__(47785);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketReplication = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketReplication",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?replication"
    },
    input: {
        shape: DeleteBucketReplicationInput_1.DeleteBucketReplicationInput
    },
    output: {
        shape: DeleteBucketReplicationOutput_1.DeleteBucketReplicationOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketReplication.js.map

/***/ }),

/***/ 98141:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketReplicationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketReplicationInput.js.map

/***/ }),

/***/ 47785:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketReplicationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketReplicationOutput.js.map

/***/ }),

/***/ 42904:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketTaggingInput_1 = __webpack_require__(32220);
var DeleteBucketTaggingOutput_1 = __webpack_require__(34492);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketTagging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketTagging",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?tagging"
    },
    input: {
        shape: DeleteBucketTaggingInput_1.DeleteBucketTaggingInput
    },
    output: {
        shape: DeleteBucketTaggingOutput_1.DeleteBucketTaggingOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketTagging.js.map

/***/ }),

/***/ 32220:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketTaggingInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketTaggingInput.js.map

/***/ }),

/***/ 34492:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketTaggingOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketTaggingOutput.js.map

/***/ }),

/***/ 81545:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteBucketWebsiteInput_1 = __webpack_require__(83297);
var DeleteBucketWebsiteOutput_1 = __webpack_require__(37468);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteBucketWebsite = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteBucketWebsite",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}?website"
    },
    input: {
        shape: DeleteBucketWebsiteInput_1.DeleteBucketWebsiteInput
    },
    output: {
        shape: DeleteBucketWebsiteOutput_1.DeleteBucketWebsiteOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteBucketWebsite.js.map

/***/ }),

/***/ 83297:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketWebsiteInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=DeleteBucketWebsiteInput.js.map

/***/ }),

/***/ 37468:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteBucketWebsiteOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=DeleteBucketWebsiteOutput.js.map

/***/ }),

/***/ 49863:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteObjectInput_1 = __webpack_require__(91589);
var DeleteObjectOutput_1 = __webpack_require__(31641);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteObject = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteObject",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: DeleteObjectInput_1.DeleteObjectInput
    },
    output: {
        shape: DeleteObjectOutput_1.DeleteObjectOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteObject.js.map

/***/ }),

/***/ 91589:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteObjectInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        MFA: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-mfa"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=DeleteObjectInput.js.map

/***/ }),

/***/ 31641:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteObjectOutput = {
    type: "structure",
    required: [],
    members: {
        DeleteMarker: {
            shape: {
                type: "boolean"
            },
            location: "header",
            locationName: "x-amz-delete-marker"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=DeleteObjectOutput.js.map

/***/ }),

/***/ 99666:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteObjectTaggingInput_1 = __webpack_require__(10117);
var DeleteObjectTaggingOutput_1 = __webpack_require__(83431);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteObjectTagging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteObjectTagging",
    http: {
        method: "DELETE",
        requestUri: "/{Bucket}/{Key+}?tagging"
    },
    input: {
        shape: DeleteObjectTaggingInput_1.DeleteObjectTaggingInput
    },
    output: {
        shape: DeleteObjectTaggingOutput_1.DeleteObjectTaggingOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteObjectTagging.js.map

/***/ }),

/***/ 10117:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteObjectTaggingInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        }
    }
};
//# sourceMappingURL=DeleteObjectTaggingInput.js.map

/***/ }),

/***/ 83431:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteObjectTaggingOutput = {
    type: "structure",
    required: [],
    members: {
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        }
    }
};
//# sourceMappingURL=DeleteObjectTaggingOutput.js.map

/***/ }),

/***/ 97001:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var DeleteObjectsInput_1 = __webpack_require__(79253);
var DeleteObjectsOutput_1 = __webpack_require__(14971);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.DeleteObjects = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "DeleteObjects",
    http: {
        method: "POST",
        requestUri: "/{Bucket}?delete"
    },
    input: {
        shape: DeleteObjectsInput_1.DeleteObjectsInput
    },
    output: {
        shape: DeleteObjectsOutput_1.DeleteObjectsOutput
    },
    errors: []
};
//# sourceMappingURL=DeleteObjects.js.map

/***/ }),

/***/ 79253:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Delete_1 = __webpack_require__(80578);
exports.DeleteObjectsInput = {
    type: "structure",
    required: ["Bucket", "Delete"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Delete: {
            shape: _Delete_1._Delete,
            locationName: "Delete",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        MFA: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-mfa"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    },
    payload: "Delete"
};
//# sourceMappingURL=DeleteObjectsInput.js.map

/***/ }),

/***/ 14971:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _DeletedObjects_1 = __webpack_require__(14945);
var _Errors_1 = __webpack_require__(37226);
exports.DeleteObjectsOutput = {
    type: "structure",
    required: [],
    members: {
        Deleted: {
            shape: _DeletedObjects_1._DeletedObjects
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        },
        Errors: {
            shape: _Errors_1._Errors,
            locationName: "Error"
        }
    }
};
//# sourceMappingURL=DeleteObjectsOutput.js.map

/***/ }),

/***/ 69140:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketAccelerateConfigurationInput_1 = __webpack_require__(60024);
var GetBucketAccelerateConfigurationOutput_1 = __webpack_require__(99410);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketAccelerateConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketAccelerateConfiguration",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?accelerate"
    },
    input: {
        shape: GetBucketAccelerateConfigurationInput_1.GetBucketAccelerateConfigurationInput
    },
    output: {
        shape: GetBucketAccelerateConfigurationOutput_1.GetBucketAccelerateConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketAccelerateConfiguration.js.map

/***/ }),

/***/ 60024:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketAccelerateConfigurationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketAccelerateConfigurationInput.js.map

/***/ }),

/***/ 99410:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketAccelerateConfigurationOutput = {
    type: "structure",
    required: [],
    members: {
        Status: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=GetBucketAccelerateConfigurationOutput.js.map

/***/ }),

/***/ 6129:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketAclInput_1 = __webpack_require__(1732);
var GetBucketAclOutput_1 = __webpack_require__(14003);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketAcl = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketAcl",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?acl"
    },
    input: {
        shape: GetBucketAclInput_1.GetBucketAclInput
    },
    output: {
        shape: GetBucketAclOutput_1.GetBucketAclOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketAcl.js.map

/***/ }),

/***/ 1732:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketAclInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketAclInput.js.map

/***/ }),

/***/ 14003:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Owner_1 = __webpack_require__(17885);
var _Grants_1 = __webpack_require__(50781);
exports.GetBucketAclOutput = {
    type: "structure",
    required: [],
    members: {
        Owner: {
            shape: _Owner_1._Owner
        },
        Grants: {
            shape: _Grants_1._Grants,
            locationName: "AccessControlList"
        }
    }
};
//# sourceMappingURL=GetBucketAclOutput.js.map

/***/ }),

/***/ 16446:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketAnalyticsConfigurationInput_1 = __webpack_require__(99618);
var GetBucketAnalyticsConfigurationOutput_1 = __webpack_require__(65410);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketAnalyticsConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketAnalyticsConfiguration",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?analytics"
    },
    input: {
        shape: GetBucketAnalyticsConfigurationInput_1.GetBucketAnalyticsConfigurationInput
    },
    output: {
        shape: GetBucketAnalyticsConfigurationOutput_1.GetBucketAnalyticsConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketAnalyticsConfiguration.js.map

/***/ }),

/***/ 99618:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketAnalyticsConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        }
    }
};
//# sourceMappingURL=GetBucketAnalyticsConfigurationInput.js.map

/***/ }),

/***/ 65410:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AnalyticsConfiguration_1 = __webpack_require__(18491);
exports.GetBucketAnalyticsConfigurationOutput = {
    type: "structure",
    required: [],
    members: {
        AnalyticsConfiguration: {
            shape: _AnalyticsConfiguration_1._AnalyticsConfiguration
        }
    },
    payload: "AnalyticsConfiguration"
};
//# sourceMappingURL=GetBucketAnalyticsConfigurationOutput.js.map

/***/ }),

/***/ 60766:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketCorsInput_1 = __webpack_require__(66668);
var GetBucketCorsOutput_1 = __webpack_require__(39950);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketCors = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketCors",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?cors"
    },
    input: {
        shape: GetBucketCorsInput_1.GetBucketCorsInput
    },
    output: {
        shape: GetBucketCorsOutput_1.GetBucketCorsOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketCors.js.map

/***/ }),

/***/ 66668:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketCorsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketCorsInput.js.map

/***/ }),

/***/ 39950:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CORSRules_1 = __webpack_require__(44387);
exports.GetBucketCorsOutput = {
    type: "structure",
    required: [],
    members: {
        CORSRules: {
            shape: _CORSRules_1._CORSRules,
            locationName: "CORSRule"
        }
    }
};
//# sourceMappingURL=GetBucketCorsOutput.js.map

/***/ }),

/***/ 71215:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketEncryptionInput_1 = __webpack_require__(16160);
var GetBucketEncryptionOutput_1 = __webpack_require__(41815);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketEncryption = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketEncryption",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?encryption"
    },
    input: {
        shape: GetBucketEncryptionInput_1.GetBucketEncryptionInput
    },
    output: {
        shape: GetBucketEncryptionOutput_1.GetBucketEncryptionOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketEncryption.js.map

/***/ }),

/***/ 16160:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketEncryptionInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketEncryptionInput.js.map

/***/ }),

/***/ 41815:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ServerSideEncryptionConfiguration_1 = __webpack_require__(25535);
exports.GetBucketEncryptionOutput = {
    type: "structure",
    required: [],
    members: {
        ServerSideEncryptionConfiguration: {
            shape: _ServerSideEncryptionConfiguration_1._ServerSideEncryptionConfiguration
        }
    },
    payload: "ServerSideEncryptionConfiguration"
};
//# sourceMappingURL=GetBucketEncryptionOutput.js.map

/***/ }),

/***/ 83163:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketInventoryConfigurationInput_1 = __webpack_require__(68507);
var GetBucketInventoryConfigurationOutput_1 = __webpack_require__(12960);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketInventoryConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketInventoryConfiguration",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?inventory"
    },
    input: {
        shape: GetBucketInventoryConfigurationInput_1.GetBucketInventoryConfigurationInput
    },
    output: {
        shape: GetBucketInventoryConfigurationOutput_1.GetBucketInventoryConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketInventoryConfiguration.js.map

/***/ }),

/***/ 68507:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketInventoryConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        }
    }
};
//# sourceMappingURL=GetBucketInventoryConfigurationInput.js.map

/***/ }),

/***/ 12960:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InventoryConfiguration_1 = __webpack_require__(27890);
exports.GetBucketInventoryConfigurationOutput = {
    type: "structure",
    required: [],
    members: {
        InventoryConfiguration: {
            shape: _InventoryConfiguration_1._InventoryConfiguration
        }
    },
    payload: "InventoryConfiguration"
};
//# sourceMappingURL=GetBucketInventoryConfigurationOutput.js.map

/***/ }),

/***/ 5706:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketLifecycleInput_1 = __webpack_require__(27445);
var GetBucketLifecycleOutput_1 = __webpack_require__(34117);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketLifecycle = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketLifecycle",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?lifecycle"
    },
    input: {
        shape: GetBucketLifecycleInput_1.GetBucketLifecycleInput
    },
    output: {
        shape: GetBucketLifecycleOutput_1.GetBucketLifecycleOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketLifecycle.js.map

/***/ }),

/***/ 76803:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketLifecycleConfigurationInput_1 = __webpack_require__(64457);
var GetBucketLifecycleConfigurationOutput_1 = __webpack_require__(10275);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketLifecycleConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketLifecycleConfiguration",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?lifecycle"
    },
    input: {
        shape: GetBucketLifecycleConfigurationInput_1.GetBucketLifecycleConfigurationInput
    },
    output: {
        shape: GetBucketLifecycleConfigurationOutput_1.GetBucketLifecycleConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketLifecycleConfiguration.js.map

/***/ }),

/***/ 64457:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketLifecycleConfigurationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketLifecycleConfigurationInput.js.map

/***/ }),

/***/ 10275:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LifecycleRules_1 = __webpack_require__(70954);
exports.GetBucketLifecycleConfigurationOutput = {
    type: "structure",
    required: [],
    members: {
        Rules: {
            shape: _LifecycleRules_1._LifecycleRules,
            locationName: "Rule"
        }
    }
};
//# sourceMappingURL=GetBucketLifecycleConfigurationOutput.js.map

/***/ }),

/***/ 27445:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketLifecycleInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketLifecycleInput.js.map

/***/ }),

/***/ 34117:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Rules_1 = __webpack_require__(30169);
exports.GetBucketLifecycleOutput = {
    type: "structure",
    required: [],
    members: {
        Rules: {
            shape: _Rules_1._Rules,
            locationName: "Rule"
        }
    }
};
//# sourceMappingURL=GetBucketLifecycleOutput.js.map

/***/ }),

/***/ 5719:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketLocationInput_1 = __webpack_require__(80672);
var GetBucketLocationOutput_1 = __webpack_require__(55397);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketLocation = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketLocation",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?location"
    },
    input: {
        shape: GetBucketLocationInput_1.GetBucketLocationInput
    },
    output: {
        shape: GetBucketLocationOutput_1.GetBucketLocationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketLocation.js.map

/***/ }),

/***/ 80672:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketLocationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketLocationInput.js.map

/***/ }),

/***/ 55397:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketLocationOutput = {
    type: "structure",
    required: [],
    members: {
        LocationConstraint: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=GetBucketLocationOutput.js.map

/***/ }),

/***/ 98760:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketLoggingInput_1 = __webpack_require__(49517);
var GetBucketLoggingOutput_1 = __webpack_require__(1493);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketLogging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketLogging",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?logging"
    },
    input: {
        shape: GetBucketLoggingInput_1.GetBucketLoggingInput
    },
    output: {
        shape: GetBucketLoggingOutput_1.GetBucketLoggingOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketLogging.js.map

/***/ }),

/***/ 49517:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketLoggingInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketLoggingInput.js.map

/***/ }),

/***/ 1493:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LoggingEnabled_1 = __webpack_require__(69205);
exports.GetBucketLoggingOutput = {
    type: "structure",
    required: [],
    members: {
        LoggingEnabled: {
            shape: _LoggingEnabled_1._LoggingEnabled
        }
    }
};
//# sourceMappingURL=GetBucketLoggingOutput.js.map

/***/ }),

/***/ 49515:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketMetricsConfigurationInput_1 = __webpack_require__(46419);
var GetBucketMetricsConfigurationOutput_1 = __webpack_require__(69025);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketMetricsConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketMetricsConfiguration",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?metrics"
    },
    input: {
        shape: GetBucketMetricsConfigurationInput_1.GetBucketMetricsConfigurationInput
    },
    output: {
        shape: GetBucketMetricsConfigurationOutput_1.GetBucketMetricsConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketMetricsConfiguration.js.map

/***/ }),

/***/ 46419:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketMetricsConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        }
    }
};
//# sourceMappingURL=GetBucketMetricsConfigurationInput.js.map

/***/ }),

/***/ 69025:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MetricsConfiguration_1 = __webpack_require__(84956);
exports.GetBucketMetricsConfigurationOutput = {
    type: "structure",
    required: [],
    members: {
        MetricsConfiguration: {
            shape: _MetricsConfiguration_1._MetricsConfiguration
        }
    },
    payload: "MetricsConfiguration"
};
//# sourceMappingURL=GetBucketMetricsConfigurationOutput.js.map

/***/ }),

/***/ 36755:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketNotificationInput_1 = __webpack_require__(3518);
var GetBucketNotificationOutput_1 = __webpack_require__(75253);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketNotification = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketNotification",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?notification"
    },
    input: {
        shape: GetBucketNotificationInput_1.GetBucketNotificationInput
    },
    output: {
        shape: GetBucketNotificationOutput_1.GetBucketNotificationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketNotification.js.map

/***/ }),

/***/ 88391:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketNotificationConfigurationInput_1 = __webpack_require__(20428);
var GetBucketNotificationConfigurationOutput_1 = __webpack_require__(38767);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketNotificationConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketNotificationConfiguration",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?notification"
    },
    input: {
        shape: GetBucketNotificationConfigurationInput_1.GetBucketNotificationConfigurationInput
    },
    output: {
        shape: GetBucketNotificationConfigurationOutput_1.GetBucketNotificationConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketNotificationConfiguration.js.map

/***/ }),

/***/ 20428:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketNotificationConfigurationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketNotificationConfigurationInput.js.map

/***/ }),

/***/ 38767:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TopicConfigurationList_1 = __webpack_require__(89504);
var _QueueConfigurationList_1 = __webpack_require__(22643);
var _LambdaFunctionConfigurationList_1 = __webpack_require__(56091);
exports.GetBucketNotificationConfigurationOutput = {
    type: "structure",
    required: [],
    members: {
        TopicConfigurations: {
            shape: _TopicConfigurationList_1._TopicConfigurationList,
            locationName: "TopicConfiguration"
        },
        QueueConfigurations: {
            shape: _QueueConfigurationList_1._QueueConfigurationList,
            locationName: "QueueConfiguration"
        },
        LambdaFunctionConfigurations: {
            shape: _LambdaFunctionConfigurationList_1._LambdaFunctionConfigurationList,
            locationName: "CloudFunctionConfiguration"
        }
    }
};
//# sourceMappingURL=GetBucketNotificationConfigurationOutput.js.map

/***/ }),

/***/ 3518:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketNotificationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketNotificationInput.js.map

/***/ }),

/***/ 75253:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TopicConfigurationDeprecated_1 = __webpack_require__(91759);
var _QueueConfigurationDeprecated_1 = __webpack_require__(34259);
var _CloudFunctionConfiguration_1 = __webpack_require__(57182);
exports.GetBucketNotificationOutput = {
    type: "structure",
    required: [],
    members: {
        TopicConfiguration: {
            shape: _TopicConfigurationDeprecated_1._TopicConfigurationDeprecated
        },
        QueueConfiguration: {
            shape: _QueueConfigurationDeprecated_1._QueueConfigurationDeprecated
        },
        CloudFunctionConfiguration: {
            shape: _CloudFunctionConfiguration_1._CloudFunctionConfiguration
        }
    }
};
//# sourceMappingURL=GetBucketNotificationOutput.js.map

/***/ }),

/***/ 7208:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketPolicyInput_1 = __webpack_require__(43484);
var GetBucketPolicyOutput_1 = __webpack_require__(52269);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketPolicy = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketPolicy",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?policy"
    },
    input: {
        shape: GetBucketPolicyInput_1.GetBucketPolicyInput
    },
    output: {
        shape: GetBucketPolicyOutput_1.GetBucketPolicyOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketPolicy.js.map

/***/ }),

/***/ 43484:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketPolicyInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketPolicyInput.js.map

/***/ }),

/***/ 52269:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketPolicyOutput = {
    type: "structure",
    required: [],
    members: {
        Policy: {
            shape: {
                type: "string"
            }
        }
    },
    payload: "Policy"
};
//# sourceMappingURL=GetBucketPolicyOutput.js.map

/***/ }),

/***/ 92178:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketReplicationInput_1 = __webpack_require__(96251);
var GetBucketReplicationOutput_1 = __webpack_require__(62271);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketReplication = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketReplication",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?replication"
    },
    input: {
        shape: GetBucketReplicationInput_1.GetBucketReplicationInput
    },
    output: {
        shape: GetBucketReplicationOutput_1.GetBucketReplicationOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketReplication.js.map

/***/ }),

/***/ 96251:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketReplicationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketReplicationInput.js.map

/***/ }),

/***/ 62271:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ReplicationConfiguration_1 = __webpack_require__(73783);
exports.GetBucketReplicationOutput = {
    type: "structure",
    required: [],
    members: {
        ReplicationConfiguration: {
            shape: _ReplicationConfiguration_1._ReplicationConfiguration
        }
    },
    payload: "ReplicationConfiguration"
};
//# sourceMappingURL=GetBucketReplicationOutput.js.map

/***/ }),

/***/ 65633:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketRequestPaymentInput_1 = __webpack_require__(63682);
var GetBucketRequestPaymentOutput_1 = __webpack_require__(71670);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketRequestPayment = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketRequestPayment",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?requestPayment"
    },
    input: {
        shape: GetBucketRequestPaymentInput_1.GetBucketRequestPaymentInput
    },
    output: {
        shape: GetBucketRequestPaymentOutput_1.GetBucketRequestPaymentOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketRequestPayment.js.map

/***/ }),

/***/ 63682:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketRequestPaymentInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketRequestPaymentInput.js.map

/***/ }),

/***/ 71670:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketRequestPaymentOutput = {
    type: "structure",
    required: [],
    members: {
        Payer: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=GetBucketRequestPaymentOutput.js.map

/***/ }),

/***/ 9760:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketTaggingInput_1 = __webpack_require__(68399);
var GetBucketTaggingOutput_1 = __webpack_require__(95527);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketTagging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketTagging",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?tagging"
    },
    input: {
        shape: GetBucketTaggingInput_1.GetBucketTaggingInput
    },
    output: {
        shape: GetBucketTaggingOutput_1.GetBucketTaggingOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketTagging.js.map

/***/ }),

/***/ 68399:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketTaggingInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketTaggingInput.js.map

/***/ }),

/***/ 95527:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TagSet_1 = __webpack_require__(66620);
exports.GetBucketTaggingOutput = {
    type: "structure",
    required: ["TagSet"],
    members: {
        TagSet: {
            shape: _TagSet_1._TagSet
        }
    }
};
//# sourceMappingURL=GetBucketTaggingOutput.js.map

/***/ }),

/***/ 40050:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketVersioningInput_1 = __webpack_require__(10356);
var GetBucketVersioningOutput_1 = __webpack_require__(35489);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketVersioning = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketVersioning",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?versioning"
    },
    input: {
        shape: GetBucketVersioningInput_1.GetBucketVersioningInput
    },
    output: {
        shape: GetBucketVersioningOutput_1.GetBucketVersioningOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketVersioning.js.map

/***/ }),

/***/ 10356:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketVersioningInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketVersioningInput.js.map

/***/ }),

/***/ 35489:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketVersioningOutput = {
    type: "structure",
    required: [],
    members: {
        Status: {
            shape: {
                type: "string"
            }
        },
        MFADelete: {
            shape: {
                type: "string"
            },
            locationName: "MfaDelete"
        }
    }
};
//# sourceMappingURL=GetBucketVersioningOutput.js.map

/***/ }),

/***/ 4040:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetBucketWebsiteInput_1 = __webpack_require__(77667);
var GetBucketWebsiteOutput_1 = __webpack_require__(68228);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetBucketWebsite = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetBucketWebsite",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?website"
    },
    input: {
        shape: GetBucketWebsiteInput_1.GetBucketWebsiteInput
    },
    output: {
        shape: GetBucketWebsiteOutput_1.GetBucketWebsiteOutput
    },
    errors: []
};
//# sourceMappingURL=GetBucketWebsite.js.map

/***/ }),

/***/ 77667:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetBucketWebsiteInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=GetBucketWebsiteInput.js.map

/***/ }),

/***/ 68228:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _RedirectAllRequestsTo_1 = __webpack_require__(32299);
var _IndexDocument_1 = __webpack_require__(3447);
var _ErrorDocument_1 = __webpack_require__(39139);
var _RoutingRules_1 = __webpack_require__(26797);
exports.GetBucketWebsiteOutput = {
    type: "structure",
    required: [],
    members: {
        RedirectAllRequestsTo: {
            shape: _RedirectAllRequestsTo_1._RedirectAllRequestsTo
        },
        IndexDocument: {
            shape: _IndexDocument_1._IndexDocument
        },
        ErrorDocument: {
            shape: _ErrorDocument_1._ErrorDocument
        },
        RoutingRules: {
            shape: _RoutingRules_1._RoutingRules
        }
    }
};
//# sourceMappingURL=GetBucketWebsiteOutput.js.map

/***/ }),

/***/ 96494:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetObjectInput_1 = __webpack_require__(5425);
var GetObjectOutput_1 = __webpack_require__(13273);
var NoSuchKey_1 = __webpack_require__(83997);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetObject = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetObject",
    http: {
        method: "GET",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: GetObjectInput_1.GetObjectInput
    },
    output: {
        shape: GetObjectOutput_1.GetObjectOutput
    },
    errors: [
        {
            shape: NoSuchKey_1.NoSuchKey
        }
    ]
};
//# sourceMappingURL=GetObject.js.map

/***/ }),

/***/ 90580:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetObjectAclInput_1 = __webpack_require__(20235);
var GetObjectAclOutput_1 = __webpack_require__(31798);
var NoSuchKey_1 = __webpack_require__(83997);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetObjectAcl = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetObjectAcl",
    http: {
        method: "GET",
        requestUri: "/{Bucket}/{Key+}?acl"
    },
    input: {
        shape: GetObjectAclInput_1.GetObjectAclInput
    },
    output: {
        shape: GetObjectAclOutput_1.GetObjectAclOutput
    },
    errors: [
        {
            shape: NoSuchKey_1.NoSuchKey
        }
    ]
};
//# sourceMappingURL=GetObjectAcl.js.map

/***/ }),

/***/ 20235:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetObjectAclInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=GetObjectAclInput.js.map

/***/ }),

/***/ 31798:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Owner_1 = __webpack_require__(17885);
var _Grants_1 = __webpack_require__(50781);
exports.GetObjectAclOutput = {
    type: "structure",
    required: [],
    members: {
        Owner: {
            shape: _Owner_1._Owner
        },
        Grants: {
            shape: _Grants_1._Grants,
            locationName: "AccessControlList"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=GetObjectAclOutput.js.map

/***/ }),

/***/ 5425:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetObjectInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        IfMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "If-Match"
        },
        IfModifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "If-Modified-Since"
        },
        IfNoneMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "If-None-Match"
        },
        IfUnmodifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "If-Unmodified-Since"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        Range: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Range"
        },
        ResponseCacheControl: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "response-cache-control"
        },
        ResponseContentDisposition: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "response-content-disposition"
        },
        ResponseContentEncoding: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "response-content-encoding"
        },
        ResponseContentLanguage: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "response-content-language"
        },
        ResponseContentType: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "response-content-type"
        },
        ResponseExpires: {
            shape: {
                type: "timestamp"
            },
            location: "querystring",
            locationName: "response-expires"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        },
        PartNumber: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "partNumber"
        }
    }
};
//# sourceMappingURL=GetObjectInput.js.map

/***/ }),

/***/ 13273:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Metadata_1 = __webpack_require__(43941);
exports.GetObjectOutput = {
    type: "structure",
    required: [],
    members: {
        Body: {
            shape: {
                type: "blob"
            },
            streaming: true
        },
        DeleteMarker: {
            shape: {
                type: "boolean"
            },
            location: "header",
            locationName: "x-amz-delete-marker"
        },
        AcceptRanges: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "accept-ranges"
        },
        Expiration: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-expiration"
        },
        Restore: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-restore"
        },
        LastModified: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "Last-Modified"
        },
        ContentLength: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "Content-Length"
        },
        ETag: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "ETag"
        },
        MissingMeta: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "x-amz-missing-meta"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        },
        CacheControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Cache-Control"
        },
        ContentDisposition: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Disposition"
        },
        ContentEncoding: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Encoding"
        },
        ContentLanguage: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Language"
        },
        ContentRange: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Range"
        },
        ContentType: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Type"
        },
        Expires: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "Expires"
        },
        WebsiteRedirectLocation: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-website-redirect-location"
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        Metadata: {
            shape: _Metadata_1._Metadata,
            location: "headers",
            locationName: "x-amz-meta-"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        StorageClass: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-storage-class"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        },
        ReplicationStatus: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-replication-status"
        },
        PartsCount: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "x-amz-mp-parts-count"
        },
        TagCount: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "x-amz-tagging-count"
        }
    },
    payload: "Body"
};
//# sourceMappingURL=GetObjectOutput.js.map

/***/ }),

/***/ 93721:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetObjectTaggingInput_1 = __webpack_require__(99472);
var GetObjectTaggingOutput_1 = __webpack_require__(88204);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetObjectTagging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetObjectTagging",
    http: {
        method: "GET",
        requestUri: "/{Bucket}/{Key+}?tagging"
    },
    input: {
        shape: GetObjectTaggingInput_1.GetObjectTaggingInput
    },
    output: {
        shape: GetObjectTaggingOutput_1.GetObjectTaggingOutput
    },
    errors: []
};
//# sourceMappingURL=GetObjectTagging.js.map

/***/ }),

/***/ 99472:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetObjectTaggingInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        }
    }
};
//# sourceMappingURL=GetObjectTaggingInput.js.map

/***/ }),

/***/ 88204:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TagSet_1 = __webpack_require__(66620);
exports.GetObjectTaggingOutput = {
    type: "structure",
    required: ["TagSet"],
    members: {
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        },
        TagSet: {
            shape: _TagSet_1._TagSet
        }
    }
};
//# sourceMappingURL=GetObjectTaggingOutput.js.map

/***/ }),

/***/ 56377:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var GetObjectTorrentInput_1 = __webpack_require__(47018);
var GetObjectTorrentOutput_1 = __webpack_require__(80303);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.GetObjectTorrent = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "GetObjectTorrent",
    http: {
        method: "GET",
        requestUri: "/{Bucket}/{Key+}?torrent"
    },
    input: {
        shape: GetObjectTorrentInput_1.GetObjectTorrentInput
    },
    output: {
        shape: GetObjectTorrentOutput_1.GetObjectTorrentOutput
    },
    errors: []
};
//# sourceMappingURL=GetObjectTorrent.js.map

/***/ }),

/***/ 47018:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetObjectTorrentInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=GetObjectTorrentInput.js.map

/***/ }),

/***/ 80303:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GetObjectTorrentOutput = {
    type: "structure",
    required: [],
    members: {
        Body: {
            shape: {
                type: "blob"
            },
            streaming: true
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    },
    payload: "Body"
};
//# sourceMappingURL=GetObjectTorrentOutput.js.map

/***/ }),

/***/ 50595:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var HeadBucketInput_1 = __webpack_require__(94565);
var HeadBucketOutput_1 = __webpack_require__(670);
var NoSuchBucket_1 = __webpack_require__(44467);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.HeadBucket = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "HeadBucket",
    http: {
        method: "HEAD",
        requestUri: "/{Bucket}"
    },
    input: {
        shape: HeadBucketInput_1.HeadBucketInput
    },
    output: {
        shape: HeadBucketOutput_1.HeadBucketOutput
    },
    errors: [
        {
            shape: NoSuchBucket_1.NoSuchBucket
        }
    ]
};
//# sourceMappingURL=HeadBucket.js.map

/***/ }),

/***/ 94565:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HeadBucketInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        }
    }
};
//# sourceMappingURL=HeadBucketInput.js.map

/***/ }),

/***/ 670:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HeadBucketOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=HeadBucketOutput.js.map

/***/ }),

/***/ 31386:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var HeadObjectInput_1 = __webpack_require__(29094);
var HeadObjectOutput_1 = __webpack_require__(11590);
var NoSuchKey_1 = __webpack_require__(83997);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.HeadObject = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "HeadObject",
    http: {
        method: "HEAD",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: HeadObjectInput_1.HeadObjectInput
    },
    output: {
        shape: HeadObjectOutput_1.HeadObjectOutput
    },
    errors: [
        {
            shape: NoSuchKey_1.NoSuchKey
        }
    ]
};
//# sourceMappingURL=HeadObject.js.map

/***/ }),

/***/ 29094:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HeadObjectInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        IfMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "If-Match"
        },
        IfModifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "If-Modified-Since"
        },
        IfNoneMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "If-None-Match"
        },
        IfUnmodifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "If-Unmodified-Since"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        Range: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Range"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        },
        PartNumber: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "partNumber"
        }
    }
};
//# sourceMappingURL=HeadObjectInput.js.map

/***/ }),

/***/ 11590:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Metadata_1 = __webpack_require__(43941);
exports.HeadObjectOutput = {
    type: "structure",
    required: [],
    members: {
        DeleteMarker: {
            shape: {
                type: "boolean"
            },
            location: "header",
            locationName: "x-amz-delete-marker"
        },
        AcceptRanges: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "accept-ranges"
        },
        Expiration: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-expiration"
        },
        Restore: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-restore"
        },
        LastModified: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "Last-Modified"
        },
        ContentLength: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "Content-Length"
        },
        ETag: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "ETag"
        },
        MissingMeta: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "x-amz-missing-meta"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        },
        CacheControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Cache-Control"
        },
        ContentDisposition: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Disposition"
        },
        ContentEncoding: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Encoding"
        },
        ContentLanguage: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Language"
        },
        ContentType: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Type"
        },
        Expires: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "Expires"
        },
        WebsiteRedirectLocation: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-website-redirect-location"
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        Metadata: {
            shape: _Metadata_1._Metadata,
            location: "headers",
            locationName: "x-amz-meta-"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        StorageClass: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-storage-class"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        },
        ReplicationStatus: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-replication-status"
        },
        PartsCount: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "x-amz-mp-parts-count"
        }
    }
};
//# sourceMappingURL=HeadObjectOutput.js.map

/***/ }),

/***/ 24177:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListBucketAnalyticsConfigurationsInput_1 = __webpack_require__(94057);
var ListBucketAnalyticsConfigurationsOutput_1 = __webpack_require__(5944);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListBucketAnalyticsConfigurations = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListBucketAnalyticsConfigurations",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?analytics"
    },
    input: {
        shape: ListBucketAnalyticsConfigurationsInput_1.ListBucketAnalyticsConfigurationsInput
    },
    output: {
        shape: ListBucketAnalyticsConfigurationsOutput_1.ListBucketAnalyticsConfigurationsOutput
    },
    errors: []
};
//# sourceMappingURL=ListBucketAnalyticsConfigurations.js.map

/***/ }),

/***/ 94057:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListBucketAnalyticsConfigurationsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContinuationToken: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "continuation-token"
        }
    }
};
//# sourceMappingURL=ListBucketAnalyticsConfigurationsInput.js.map

/***/ }),

/***/ 5944:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AnalyticsConfigurationList_1 = __webpack_require__(75383);
exports.ListBucketAnalyticsConfigurationsOutput = {
    type: "structure",
    required: [],
    members: {
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        ContinuationToken: {
            shape: {
                type: "string"
            }
        },
        NextContinuationToken: {
            shape: {
                type: "string"
            }
        },
        AnalyticsConfigurationList: {
            shape: _AnalyticsConfigurationList_1._AnalyticsConfigurationList,
            locationName: "AnalyticsConfiguration"
        }
    }
};
//# sourceMappingURL=ListBucketAnalyticsConfigurationsOutput.js.map

/***/ }),

/***/ 73934:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListBucketInventoryConfigurationsInput_1 = __webpack_require__(14257);
var ListBucketInventoryConfigurationsOutput_1 = __webpack_require__(91925);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListBucketInventoryConfigurations = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListBucketInventoryConfigurations",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?inventory"
    },
    input: {
        shape: ListBucketInventoryConfigurationsInput_1.ListBucketInventoryConfigurationsInput
    },
    output: {
        shape: ListBucketInventoryConfigurationsOutput_1.ListBucketInventoryConfigurationsOutput
    },
    errors: []
};
//# sourceMappingURL=ListBucketInventoryConfigurations.js.map

/***/ }),

/***/ 14257:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListBucketInventoryConfigurationsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContinuationToken: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "continuation-token"
        }
    }
};
//# sourceMappingURL=ListBucketInventoryConfigurationsInput.js.map

/***/ }),

/***/ 91925:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InventoryConfigurationList_1 = __webpack_require__(69146);
exports.ListBucketInventoryConfigurationsOutput = {
    type: "structure",
    required: [],
    members: {
        ContinuationToken: {
            shape: {
                type: "string"
            }
        },
        InventoryConfigurationList: {
            shape: _InventoryConfigurationList_1._InventoryConfigurationList,
            locationName: "InventoryConfiguration"
        },
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        NextContinuationToken: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=ListBucketInventoryConfigurationsOutput.js.map

/***/ }),

/***/ 4194:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListBucketMetricsConfigurationsInput_1 = __webpack_require__(18326);
var ListBucketMetricsConfigurationsOutput_1 = __webpack_require__(29457);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListBucketMetricsConfigurations = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListBucketMetricsConfigurations",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?metrics"
    },
    input: {
        shape: ListBucketMetricsConfigurationsInput_1.ListBucketMetricsConfigurationsInput
    },
    output: {
        shape: ListBucketMetricsConfigurationsOutput_1.ListBucketMetricsConfigurationsOutput
    },
    errors: []
};
//# sourceMappingURL=ListBucketMetricsConfigurations.js.map

/***/ }),

/***/ 18326:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListBucketMetricsConfigurationsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContinuationToken: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "continuation-token"
        }
    }
};
//# sourceMappingURL=ListBucketMetricsConfigurationsInput.js.map

/***/ }),

/***/ 29457:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MetricsConfigurationList_1 = __webpack_require__(5685);
exports.ListBucketMetricsConfigurationsOutput = {
    type: "structure",
    required: [],
    members: {
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        ContinuationToken: {
            shape: {
                type: "string"
            }
        },
        NextContinuationToken: {
            shape: {
                type: "string"
            }
        },
        MetricsConfigurationList: {
            shape: _MetricsConfigurationList_1._MetricsConfigurationList,
            locationName: "MetricsConfiguration"
        }
    }
};
//# sourceMappingURL=ListBucketMetricsConfigurationsOutput.js.map

/***/ }),

/***/ 27252:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListBucketsInput_1 = __webpack_require__(60287);
var ListBucketsOutput_1 = __webpack_require__(54391);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListBuckets = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListBuckets",
    http: {
        method: "GET",
        requestUri: "/"
    },
    input: {
        shape: ListBucketsInput_1.ListBucketsInput
    },
    output: {
        shape: ListBucketsOutput_1.ListBucketsOutput
    },
    errors: []
};
//# sourceMappingURL=ListBuckets.js.map

/***/ }),

/***/ 60287:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListBucketsInput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=ListBucketsInput.js.map

/***/ }),

/***/ 54391:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Buckets_1 = __webpack_require__(48456);
var _Owner_1 = __webpack_require__(17885);
exports.ListBucketsOutput = {
    type: "structure",
    required: [],
    members: {
        Buckets: {
            shape: _Buckets_1._Buckets
        },
        Owner: {
            shape: _Owner_1._Owner
        }
    }
};
//# sourceMappingURL=ListBucketsOutput.js.map

/***/ }),

/***/ 39893:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListMultipartUploadsInput_1 = __webpack_require__(75186);
var ListMultipartUploadsOutput_1 = __webpack_require__(30381);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListMultipartUploads = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListMultipartUploads",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?uploads"
    },
    input: {
        shape: ListMultipartUploadsInput_1.ListMultipartUploadsInput
    },
    output: {
        shape: ListMultipartUploadsOutput_1.ListMultipartUploadsOutput
    },
    errors: []
};
//# sourceMappingURL=ListMultipartUploads.js.map

/***/ }),

/***/ 75186:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListMultipartUploadsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Delimiter: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "delimiter"
        },
        EncodingType: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "encoding-type"
        },
        KeyMarker: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "key-marker"
        },
        MaxUploads: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "max-uploads"
        },
        Prefix: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "prefix"
        },
        UploadIdMarker: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "upload-id-marker"
        }
    }
};
//# sourceMappingURL=ListMultipartUploadsInput.js.map

/***/ }),

/***/ 30381:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MultipartUploadList_1 = __webpack_require__(27785);
var _CommonPrefixList_1 = __webpack_require__(41186);
exports.ListMultipartUploadsOutput = {
    type: "structure",
    required: [],
    members: {
        Bucket: {
            shape: {
                type: "string"
            }
        },
        KeyMarker: {
            shape: {
                type: "string"
            }
        },
        UploadIdMarker: {
            shape: {
                type: "string"
            }
        },
        NextKeyMarker: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Delimiter: {
            shape: {
                type: "string"
            }
        },
        NextUploadIdMarker: {
            shape: {
                type: "string"
            }
        },
        MaxUploads: {
            shape: {
                type: "integer"
            }
        },
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        Uploads: {
            shape: _MultipartUploadList_1._MultipartUploadList,
            locationName: "Upload"
        },
        CommonPrefixes: {
            shape: _CommonPrefixList_1._CommonPrefixList
        },
        EncodingType: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=ListMultipartUploadsOutput.js.map

/***/ }),

/***/ 79762:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListObjectVersionsInput_1 = __webpack_require__(19369);
var ListObjectVersionsOutput_1 = __webpack_require__(99841);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListObjectVersions = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListObjectVersions",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?versions"
    },
    input: {
        shape: ListObjectVersionsInput_1.ListObjectVersionsInput
    },
    output: {
        shape: ListObjectVersionsOutput_1.ListObjectVersionsOutput
    },
    errors: []
};
//# sourceMappingURL=ListObjectVersions.js.map

/***/ }),

/***/ 19369:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListObjectVersionsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Delimiter: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "delimiter"
        },
        EncodingType: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "encoding-type"
        },
        KeyMarker: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "key-marker"
        },
        MaxKeys: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "max-keys"
        },
        Prefix: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "prefix"
        },
        VersionIdMarker: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "version-id-marker"
        }
    }
};
//# sourceMappingURL=ListObjectVersionsInput.js.map

/***/ }),

/***/ 99841:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ObjectVersionList_1 = __webpack_require__(64917);
var _DeleteMarkers_1 = __webpack_require__(65957);
var _CommonPrefixList_1 = __webpack_require__(41186);
exports.ListObjectVersionsOutput = {
    type: "structure",
    required: [],
    members: {
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        KeyMarker: {
            shape: {
                type: "string"
            }
        },
        VersionIdMarker: {
            shape: {
                type: "string"
            }
        },
        NextKeyMarker: {
            shape: {
                type: "string"
            }
        },
        NextVersionIdMarker: {
            shape: {
                type: "string"
            }
        },
        Versions: {
            shape: _ObjectVersionList_1._ObjectVersionList,
            locationName: "Version"
        },
        DeleteMarkers: {
            shape: _DeleteMarkers_1._DeleteMarkers,
            locationName: "DeleteMarker"
        },
        Name: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Delimiter: {
            shape: {
                type: "string"
            }
        },
        MaxKeys: {
            shape: {
                type: "integer"
            }
        },
        CommonPrefixes: {
            shape: _CommonPrefixList_1._CommonPrefixList
        },
        EncodingType: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=ListObjectVersionsOutput.js.map

/***/ }),

/***/ 59373:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListObjectsInput_1 = __webpack_require__(94469);
var ListObjectsOutput_1 = __webpack_require__(22209);
var NoSuchBucket_1 = __webpack_require__(44467);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListObjects = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListObjects",
    http: {
        method: "GET",
        requestUri: "/{Bucket}"
    },
    input: {
        shape: ListObjectsInput_1.ListObjectsInput
    },
    output: {
        shape: ListObjectsOutput_1.ListObjectsOutput
    },
    errors: [
        {
            shape: NoSuchBucket_1.NoSuchBucket
        }
    ]
};
//# sourceMappingURL=ListObjects.js.map

/***/ }),

/***/ 94469:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListObjectsInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Delimiter: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "delimiter"
        },
        EncodingType: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "encoding-type"
        },
        Marker: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "marker"
        },
        MaxKeys: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "max-keys"
        },
        Prefix: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "prefix"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=ListObjectsInput.js.map

/***/ }),

/***/ 22209:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ObjectList_1 = __webpack_require__(35183);
var _CommonPrefixList_1 = __webpack_require__(41186);
exports.ListObjectsOutput = {
    type: "structure",
    required: [],
    members: {
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        Marker: {
            shape: {
                type: "string"
            }
        },
        NextMarker: {
            shape: {
                type: "string"
            }
        },
        Contents: {
            shape: _ObjectList_1._ObjectList
        },
        Name: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Delimiter: {
            shape: {
                type: "string"
            }
        },
        MaxKeys: {
            shape: {
                type: "integer"
            }
        },
        CommonPrefixes: {
            shape: _CommonPrefixList_1._CommonPrefixList
        },
        EncodingType: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=ListObjectsOutput.js.map

/***/ }),

/***/ 25285:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListObjectsV2Input_1 = __webpack_require__(67097);
var ListObjectsV2Output_1 = __webpack_require__(46792);
var NoSuchBucket_1 = __webpack_require__(44467);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListObjectsV2 = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListObjectsV2",
    http: {
        method: "GET",
        requestUri: "/{Bucket}?list-type=2"
    },
    input: {
        shape: ListObjectsV2Input_1.ListObjectsV2Input
    },
    output: {
        shape: ListObjectsV2Output_1.ListObjectsV2Output
    },
    errors: [
        {
            shape: NoSuchBucket_1.NoSuchBucket
        }
    ]
};
//# sourceMappingURL=ListObjectsV2.js.map

/***/ }),

/***/ 67097:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListObjectsV2Input = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Delimiter: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "delimiter"
        },
        EncodingType: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "encoding-type"
        },
        MaxKeys: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "max-keys"
        },
        Prefix: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "prefix"
        },
        ContinuationToken: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "continuation-token"
        },
        FetchOwner: {
            shape: {
                type: "boolean"
            },
            location: "querystring",
            locationName: "fetch-owner"
        },
        StartAfter: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "start-after"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=ListObjectsV2Input.js.map

/***/ }),

/***/ 46792:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ObjectList_1 = __webpack_require__(35183);
var _CommonPrefixList_1 = __webpack_require__(41186);
exports.ListObjectsV2Output = {
    type: "structure",
    required: [],
    members: {
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        Contents: {
            shape: _ObjectList_1._ObjectList
        },
        Name: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Delimiter: {
            shape: {
                type: "string"
            }
        },
        MaxKeys: {
            shape: {
                type: "integer"
            }
        },
        CommonPrefixes: {
            shape: _CommonPrefixList_1._CommonPrefixList
        },
        EncodingType: {
            shape: {
                type: "string"
            }
        },
        KeyCount: {
            shape: {
                type: "integer"
            }
        },
        ContinuationToken: {
            shape: {
                type: "string"
            }
        },
        NextContinuationToken: {
            shape: {
                type: "string"
            }
        },
        StartAfter: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=ListObjectsV2Output.js.map

/***/ }),

/***/ 61574:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var ListPartsInput_1 = __webpack_require__(99601);
var ListPartsOutput_1 = __webpack_require__(86474);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.ListParts = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "ListParts",
    http: {
        method: "GET",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: ListPartsInput_1.ListPartsInput
    },
    output: {
        shape: ListPartsOutput_1.ListPartsOutput
    },
    errors: []
};
//# sourceMappingURL=ListParts.js.map

/***/ }),

/***/ 99601:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ListPartsInput = {
    type: "structure",
    required: ["Bucket", "Key", "UploadId"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        MaxParts: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "max-parts"
        },
        PartNumberMarker: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "part-number-marker"
        },
        UploadId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "uploadId"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=ListPartsInput.js.map

/***/ }),

/***/ 86474:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Parts_1 = __webpack_require__(90635);
var _Initiator_1 = __webpack_require__(93083);
var _Owner_1 = __webpack_require__(17885);
exports.ListPartsOutput = {
    type: "structure",
    required: [],
    members: {
        AbortDate: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "x-amz-abort-date"
        },
        AbortRuleId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-abort-rule-id"
        },
        Bucket: {
            shape: {
                type: "string"
            }
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        UploadId: {
            shape: {
                type: "string"
            }
        },
        PartNumberMarker: {
            shape: {
                type: "integer"
            }
        },
        NextPartNumberMarker: {
            shape: {
                type: "integer"
            }
        },
        MaxParts: {
            shape: {
                type: "integer"
            }
        },
        IsTruncated: {
            shape: {
                type: "boolean"
            }
        },
        Parts: {
            shape: _Parts_1._Parts,
            locationName: "Part"
        },
        Initiator: {
            shape: _Initiator_1._Initiator
        },
        Owner: {
            shape: _Owner_1._Owner
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=ListPartsOutput.js.map

/***/ }),

/***/ 44467:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NoSuchBucket = {
    type: "structure",
    required: [],
    members: {},
    exceptionType: "NoSuchBucket"
};
//# sourceMappingURL=NoSuchBucket.js.map

/***/ }),

/***/ 83997:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NoSuchKey = {
    type: "structure",
    required: [],
    members: {},
    exceptionType: "NoSuchKey"
};
//# sourceMappingURL=NoSuchKey.js.map

/***/ }),

/***/ 18528:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NoSuchUpload = {
    type: "structure",
    required: [],
    members: {},
    exceptionType: "NoSuchUpload"
};
//# sourceMappingURL=NoSuchUpload.js.map

/***/ }),

/***/ 31555:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ObjectAlreadyInActiveTierError = {
    type: "structure",
    required: [],
    members: {},
    exceptionType: "ObjectAlreadyInActiveTierError"
};
//# sourceMappingURL=ObjectAlreadyInActiveTierError.js.map

/***/ }),

/***/ 99075:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ObjectNotInActiveTierError = {
    type: "structure",
    required: [],
    members: {},
    exceptionType: "ObjectNotInActiveTierError"
};
//# sourceMappingURL=ObjectNotInActiveTierError.js.map

/***/ }),

/***/ 50644:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketAccelerateConfigurationInput_1 = __webpack_require__(58219);
var PutBucketAccelerateConfigurationOutput_1 = __webpack_require__(67005);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketAccelerateConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketAccelerateConfiguration",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?accelerate"
    },
    input: {
        shape: PutBucketAccelerateConfigurationInput_1.PutBucketAccelerateConfigurationInput
    },
    output: {
        shape: PutBucketAccelerateConfigurationOutput_1.PutBucketAccelerateConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketAccelerateConfiguration.js.map

/***/ }),

/***/ 58219:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AccelerateConfiguration_1 = __webpack_require__(62990);
exports.PutBucketAccelerateConfigurationInput = {
    type: "structure",
    required: ["Bucket", "AccelerateConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        AccelerateConfiguration: {
            shape: _AccelerateConfiguration_1._AccelerateConfiguration,
            locationName: "AccelerateConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "AccelerateConfiguration"
};
//# sourceMappingURL=PutBucketAccelerateConfigurationInput.js.map

/***/ }),

/***/ 67005:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketAccelerateConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketAccelerateConfigurationOutput.js.map

/***/ }),

/***/ 79611:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketAclInput_1 = __webpack_require__(83452);
var PutBucketAclOutput_1 = __webpack_require__(21675);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketAcl = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketAcl",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?acl"
    },
    input: {
        shape: PutBucketAclInput_1.PutBucketAclInput
    },
    output: {
        shape: PutBucketAclOutput_1.PutBucketAclOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketAcl.js.map

/***/ }),

/***/ 83452:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AccessControlPolicy_1 = __webpack_require__(23864);
exports.PutBucketAclInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        ACL: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-acl"
        },
        AccessControlPolicy: {
            shape: _AccessControlPolicy_1._AccessControlPolicy,
            locationName: "AccessControlPolicy",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        GrantFullControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-full-control"
        },
        GrantRead: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read"
        },
        GrantReadACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read-acp"
        },
        GrantWrite: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write"
        },
        GrantWriteACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write-acp"
        }
    },
    payload: "AccessControlPolicy"
};
//# sourceMappingURL=PutBucketAclInput.js.map

/***/ }),

/***/ 21675:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketAclOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketAclOutput.js.map

/***/ }),

/***/ 43421:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketAnalyticsConfigurationInput_1 = __webpack_require__(47065);
var PutBucketAnalyticsConfigurationOutput_1 = __webpack_require__(86592);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketAnalyticsConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketAnalyticsConfiguration",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?analytics"
    },
    input: {
        shape: PutBucketAnalyticsConfigurationInput_1.PutBucketAnalyticsConfigurationInput
    },
    output: {
        shape: PutBucketAnalyticsConfigurationOutput_1.PutBucketAnalyticsConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketAnalyticsConfiguration.js.map

/***/ }),

/***/ 47065:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AnalyticsConfiguration_1 = __webpack_require__(18491);
exports.PutBucketAnalyticsConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id", "AnalyticsConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        },
        AnalyticsConfiguration: {
            shape: _AnalyticsConfiguration_1._AnalyticsConfiguration,
            locationName: "AnalyticsConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "AnalyticsConfiguration"
};
//# sourceMappingURL=PutBucketAnalyticsConfigurationInput.js.map

/***/ }),

/***/ 86592:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketAnalyticsConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketAnalyticsConfigurationOutput.js.map

/***/ }),

/***/ 83341:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketCorsInput_1 = __webpack_require__(43929);
var PutBucketCorsOutput_1 = __webpack_require__(30035);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketCors = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketCors",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?cors"
    },
    input: {
        shape: PutBucketCorsInput_1.PutBucketCorsInput
    },
    output: {
        shape: PutBucketCorsOutput_1.PutBucketCorsOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketCors.js.map

/***/ }),

/***/ 43929:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CORSConfiguration_1 = __webpack_require__(90688);
exports.PutBucketCorsInput = {
    type: "structure",
    required: ["Bucket", "CORSConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        CORSConfiguration: {
            shape: _CORSConfiguration_1._CORSConfiguration,
            locationName: "CORSConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        }
    },
    payload: "CORSConfiguration"
};
//# sourceMappingURL=PutBucketCorsInput.js.map

/***/ }),

/***/ 30035:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketCorsOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketCorsOutput.js.map

/***/ }),

/***/ 96599:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketEncryptionInput_1 = __webpack_require__(46054);
var PutBucketEncryptionOutput_1 = __webpack_require__(3870);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketEncryption = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketEncryption",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?encryption"
    },
    input: {
        shape: PutBucketEncryptionInput_1.PutBucketEncryptionInput
    },
    output: {
        shape: PutBucketEncryptionOutput_1.PutBucketEncryptionOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketEncryption.js.map

/***/ }),

/***/ 46054:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ServerSideEncryptionConfiguration_1 = __webpack_require__(25535);
exports.PutBucketEncryptionInput = {
    type: "structure",
    required: ["Bucket", "ServerSideEncryptionConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        ServerSideEncryptionConfiguration: {
            shape: _ServerSideEncryptionConfiguration_1._ServerSideEncryptionConfiguration,
            locationName: "ServerSideEncryptionConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "ServerSideEncryptionConfiguration"
};
//# sourceMappingURL=PutBucketEncryptionInput.js.map

/***/ }),

/***/ 3870:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketEncryptionOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketEncryptionOutput.js.map

/***/ }),

/***/ 13225:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketInventoryConfigurationInput_1 = __webpack_require__(91057);
var PutBucketInventoryConfigurationOutput_1 = __webpack_require__(20512);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketInventoryConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketInventoryConfiguration",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?inventory"
    },
    input: {
        shape: PutBucketInventoryConfigurationInput_1.PutBucketInventoryConfigurationInput
    },
    output: {
        shape: PutBucketInventoryConfigurationOutput_1.PutBucketInventoryConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketInventoryConfiguration.js.map

/***/ }),

/***/ 91057:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InventoryConfiguration_1 = __webpack_require__(27890);
exports.PutBucketInventoryConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id", "InventoryConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        },
        InventoryConfiguration: {
            shape: _InventoryConfiguration_1._InventoryConfiguration,
            locationName: "InventoryConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "InventoryConfiguration"
};
//# sourceMappingURL=PutBucketInventoryConfigurationInput.js.map

/***/ }),

/***/ 20512:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketInventoryConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketInventoryConfigurationOutput.js.map

/***/ }),

/***/ 99870:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketLifecycleInput_1 = __webpack_require__(91190);
var PutBucketLifecycleOutput_1 = __webpack_require__(84844);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketLifecycle = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketLifecycle",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?lifecycle"
    },
    input: {
        shape: PutBucketLifecycleInput_1.PutBucketLifecycleInput
    },
    output: {
        shape: PutBucketLifecycleOutput_1.PutBucketLifecycleOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketLifecycle.js.map

/***/ }),

/***/ 29695:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketLifecycleConfigurationInput_1 = __webpack_require__(46731);
var PutBucketLifecycleConfigurationOutput_1 = __webpack_require__(42807);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketLifecycleConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketLifecycleConfiguration",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?lifecycle"
    },
    input: {
        shape: PutBucketLifecycleConfigurationInput_1.PutBucketLifecycleConfigurationInput
    },
    output: {
        shape: PutBucketLifecycleConfigurationOutput_1.PutBucketLifecycleConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketLifecycleConfiguration.js.map

/***/ }),

/***/ 46731:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _BucketLifecycleConfiguration_1 = __webpack_require__(88672);
exports.PutBucketLifecycleConfigurationInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        LifecycleConfiguration: {
            shape: _BucketLifecycleConfiguration_1._BucketLifecycleConfiguration,
            locationName: "LifecycleConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "LifecycleConfiguration"
};
//# sourceMappingURL=PutBucketLifecycleConfigurationInput.js.map

/***/ }),

/***/ 42807:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketLifecycleConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketLifecycleConfigurationOutput.js.map

/***/ }),

/***/ 91190:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LifecycleConfiguration_1 = __webpack_require__(34018);
exports.PutBucketLifecycleInput = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        LifecycleConfiguration: {
            shape: _LifecycleConfiguration_1._LifecycleConfiguration,
            locationName: "LifecycleConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "LifecycleConfiguration"
};
//# sourceMappingURL=PutBucketLifecycleInput.js.map

/***/ }),

/***/ 84844:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketLifecycleOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketLifecycleOutput.js.map

/***/ }),

/***/ 82458:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketLoggingInput_1 = __webpack_require__(37333);
var PutBucketLoggingOutput_1 = __webpack_require__(6925);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketLogging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketLogging",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?logging"
    },
    input: {
        shape: PutBucketLoggingInput_1.PutBucketLoggingInput
    },
    output: {
        shape: PutBucketLoggingOutput_1.PutBucketLoggingOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketLogging.js.map

/***/ }),

/***/ 37333:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _BucketLoggingStatus_1 = __webpack_require__(39903);
exports.PutBucketLoggingInput = {
    type: "structure",
    required: ["Bucket", "BucketLoggingStatus"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        BucketLoggingStatus: {
            shape: _BucketLoggingStatus_1._BucketLoggingStatus,
            locationName: "BucketLoggingStatus",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        }
    },
    payload: "BucketLoggingStatus"
};
//# sourceMappingURL=PutBucketLoggingInput.js.map

/***/ }),

/***/ 6925:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketLoggingOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketLoggingOutput.js.map

/***/ }),

/***/ 61098:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketMetricsConfigurationInput_1 = __webpack_require__(58382);
var PutBucketMetricsConfigurationOutput_1 = __webpack_require__(43235);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketMetricsConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketMetricsConfiguration",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?metrics"
    },
    input: {
        shape: PutBucketMetricsConfigurationInput_1.PutBucketMetricsConfigurationInput
    },
    output: {
        shape: PutBucketMetricsConfigurationOutput_1.PutBucketMetricsConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketMetricsConfiguration.js.map

/***/ }),

/***/ 58382:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MetricsConfiguration_1 = __webpack_require__(84956);
exports.PutBucketMetricsConfigurationInput = {
    type: "structure",
    required: ["Bucket", "Id", "MetricsConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Id: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "id"
        },
        MetricsConfiguration: {
            shape: _MetricsConfiguration_1._MetricsConfiguration,
            locationName: "MetricsConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "MetricsConfiguration"
};
//# sourceMappingURL=PutBucketMetricsConfigurationInput.js.map

/***/ }),

/***/ 43235:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketMetricsConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketMetricsConfigurationOutput.js.map

/***/ }),

/***/ 2757:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketNotificationInput_1 = __webpack_require__(89745);
var PutBucketNotificationOutput_1 = __webpack_require__(25636);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketNotification = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketNotification",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?notification"
    },
    input: {
        shape: PutBucketNotificationInput_1.PutBucketNotificationInput
    },
    output: {
        shape: PutBucketNotificationOutput_1.PutBucketNotificationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketNotification.js.map

/***/ }),

/***/ 33673:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketNotificationConfigurationInput_1 = __webpack_require__(21623);
var PutBucketNotificationConfigurationOutput_1 = __webpack_require__(3747);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketNotificationConfiguration = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketNotificationConfiguration",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?notification"
    },
    input: {
        shape: PutBucketNotificationConfigurationInput_1.PutBucketNotificationConfigurationInput
    },
    output: {
        shape: PutBucketNotificationConfigurationOutput_1.PutBucketNotificationConfigurationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketNotificationConfiguration.js.map

/***/ }),

/***/ 21623:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _NotificationConfiguration_1 = __webpack_require__(54825);
exports.PutBucketNotificationConfigurationInput = {
    type: "structure",
    required: ["Bucket", "NotificationConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        NotificationConfiguration: {
            shape: _NotificationConfiguration_1._NotificationConfiguration,
            locationName: "NotificationConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "NotificationConfiguration"
};
//# sourceMappingURL=PutBucketNotificationConfigurationInput.js.map

/***/ }),

/***/ 3747:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketNotificationConfigurationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketNotificationConfigurationOutput.js.map

/***/ }),

/***/ 89745:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _NotificationConfigurationDeprecated_1 = __webpack_require__(8569);
exports.PutBucketNotificationInput = {
    type: "structure",
    required: ["Bucket", "NotificationConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        NotificationConfiguration: {
            shape: _NotificationConfigurationDeprecated_1._NotificationConfigurationDeprecated,
            locationName: "NotificationConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "NotificationConfiguration"
};
//# sourceMappingURL=PutBucketNotificationInput.js.map

/***/ }),

/***/ 25636:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketNotificationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketNotificationOutput.js.map

/***/ }),

/***/ 86115:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketPolicyInput_1 = __webpack_require__(32236);
var PutBucketPolicyOutput_1 = __webpack_require__(69659);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketPolicy = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketPolicy",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?policy"
    },
    input: {
        shape: PutBucketPolicyInput_1.PutBucketPolicyInput
    },
    output: {
        shape: PutBucketPolicyOutput_1.PutBucketPolicyOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketPolicy.js.map

/***/ }),

/***/ 32236:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketPolicyInput = {
    type: "structure",
    required: ["Bucket", "Policy"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        ConfirmRemoveSelfBucketAccess: {
            shape: {
                type: "boolean"
            },
            location: "header",
            locationName: "x-amz-confirm-remove-self-bucket-access"
        },
        Policy: {
            shape: {
                type: "string"
            }
        }
    },
    payload: "Policy"
};
//# sourceMappingURL=PutBucketPolicyInput.js.map

/***/ }),

/***/ 69659:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketPolicyOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketPolicyOutput.js.map

/***/ }),

/***/ 48734:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketReplicationInput_1 = __webpack_require__(33958);
var PutBucketReplicationOutput_1 = __webpack_require__(48039);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketReplication = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketReplication",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?replication"
    },
    input: {
        shape: PutBucketReplicationInput_1.PutBucketReplicationInput
    },
    output: {
        shape: PutBucketReplicationOutput_1.PutBucketReplicationOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketReplication.js.map

/***/ }),

/***/ 33958:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ReplicationConfiguration_1 = __webpack_require__(73783);
exports.PutBucketReplicationInput = {
    type: "structure",
    required: ["Bucket", "ReplicationConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        ReplicationConfiguration: {
            shape: _ReplicationConfiguration_1._ReplicationConfiguration,
            locationName: "ReplicationConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "ReplicationConfiguration"
};
//# sourceMappingURL=PutBucketReplicationInput.js.map

/***/ }),

/***/ 48039:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketReplicationOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketReplicationOutput.js.map

/***/ }),

/***/ 12870:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketRequestPaymentInput_1 = __webpack_require__(27981);
var PutBucketRequestPaymentOutput_1 = __webpack_require__(39223);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketRequestPayment = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketRequestPayment",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?requestPayment"
    },
    input: {
        shape: PutBucketRequestPaymentInput_1.PutBucketRequestPaymentInput
    },
    output: {
        shape: PutBucketRequestPaymentOutput_1.PutBucketRequestPaymentOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketRequestPayment.js.map

/***/ }),

/***/ 27981:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _RequestPaymentConfiguration_1 = __webpack_require__(64015);
exports.PutBucketRequestPaymentInput = {
    type: "structure",
    required: ["Bucket", "RequestPaymentConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        RequestPaymentConfiguration: {
            shape: _RequestPaymentConfiguration_1._RequestPaymentConfiguration,
            locationName: "RequestPaymentConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "RequestPaymentConfiguration"
};
//# sourceMappingURL=PutBucketRequestPaymentInput.js.map

/***/ }),

/***/ 39223:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketRequestPaymentOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketRequestPaymentOutput.js.map

/***/ }),

/***/ 7863:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketTaggingInput_1 = __webpack_require__(48460);
var PutBucketTaggingOutput_1 = __webpack_require__(15878);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketTagging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketTagging",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?tagging"
    },
    input: {
        shape: PutBucketTaggingInput_1.PutBucketTaggingInput
    },
    output: {
        shape: PutBucketTaggingOutput_1.PutBucketTaggingOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketTagging.js.map

/***/ }),

/***/ 48460:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Tagging_1 = __webpack_require__(71613);
exports.PutBucketTaggingInput = {
    type: "structure",
    required: ["Bucket", "Tagging"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        Tagging: {
            shape: _Tagging_1._Tagging,
            locationName: "Tagging",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "Tagging"
};
//# sourceMappingURL=PutBucketTaggingInput.js.map

/***/ }),

/***/ 15878:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketTaggingOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketTaggingOutput.js.map

/***/ }),

/***/ 87436:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketVersioningInput_1 = __webpack_require__(99141);
var PutBucketVersioningOutput_1 = __webpack_require__(22677);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketVersioning = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketVersioning",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?versioning"
    },
    input: {
        shape: PutBucketVersioningInput_1.PutBucketVersioningInput
    },
    output: {
        shape: PutBucketVersioningOutput_1.PutBucketVersioningOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketVersioning.js.map

/***/ }),

/***/ 99141:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _VersioningConfiguration_1 = __webpack_require__(53770);
exports.PutBucketVersioningInput = {
    type: "structure",
    required: ["Bucket", "VersioningConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        MFA: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-mfa"
        },
        VersioningConfiguration: {
            shape: _VersioningConfiguration_1._VersioningConfiguration,
            locationName: "VersioningConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "VersioningConfiguration"
};
//# sourceMappingURL=PutBucketVersioningInput.js.map

/***/ }),

/***/ 22677:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketVersioningOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketVersioningOutput.js.map

/***/ }),

/***/ 14757:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutBucketWebsiteInput_1 = __webpack_require__(28072);
var PutBucketWebsiteOutput_1 = __webpack_require__(21817);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutBucketWebsite = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutBucketWebsite",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}?website"
    },
    input: {
        shape: PutBucketWebsiteInput_1.PutBucketWebsiteInput
    },
    output: {
        shape: PutBucketWebsiteOutput_1.PutBucketWebsiteOutput
    },
    errors: []
};
//# sourceMappingURL=PutBucketWebsite.js.map

/***/ }),

/***/ 28072:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _WebsiteConfiguration_1 = __webpack_require__(86448);
exports.PutBucketWebsiteInput = {
    type: "structure",
    required: ["Bucket", "WebsiteConfiguration"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        WebsiteConfiguration: {
            shape: _WebsiteConfiguration_1._WebsiteConfiguration,
            locationName: "WebsiteConfiguration",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "WebsiteConfiguration"
};
//# sourceMappingURL=PutBucketWebsiteInput.js.map

/***/ }),

/***/ 21817:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutBucketWebsiteOutput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=PutBucketWebsiteOutput.js.map

/***/ }),

/***/ 96770:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutObjectInput_1 = __webpack_require__(39111);
var PutObjectOutput_1 = __webpack_require__(31463);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutObject = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutObject",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: PutObjectInput_1.PutObjectInput
    },
    output: {
        shape: PutObjectOutput_1.PutObjectOutput
    },
    errors: []
};
//# sourceMappingURL=PutObject.js.map

/***/ }),

/***/ 30691:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutObjectAclInput_1 = __webpack_require__(94909);
var PutObjectAclOutput_1 = __webpack_require__(30662);
var NoSuchKey_1 = __webpack_require__(83997);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutObjectAcl = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutObjectAcl",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}/{Key+}?acl"
    },
    input: {
        shape: PutObjectAclInput_1.PutObjectAclInput
    },
    output: {
        shape: PutObjectAclOutput_1.PutObjectAclOutput
    },
    errors: [
        {
            shape: NoSuchKey_1.NoSuchKey
        }
    ]
};
//# sourceMappingURL=PutObjectAcl.js.map

/***/ }),

/***/ 94909:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AccessControlPolicy_1 = __webpack_require__(23864);
exports.PutObjectAclInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        ACL: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-acl"
        },
        AccessControlPolicy: {
            shape: _AccessControlPolicy_1._AccessControlPolicy,
            locationName: "AccessControlPolicy",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        GrantFullControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-full-control"
        },
        GrantRead: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read"
        },
        GrantReadACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read-acp"
        },
        GrantWrite: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write"
        },
        GrantWriteACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write-acp"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        }
    },
    payload: "AccessControlPolicy"
};
//# sourceMappingURL=PutObjectAclInput.js.map

/***/ }),

/***/ 30662:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutObjectAclOutput = {
    type: "structure",
    required: [],
    members: {
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=PutObjectAclOutput.js.map

/***/ }),

/***/ 39111:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Metadata_1 = __webpack_require__(43941);
exports.PutObjectInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        ACL: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-acl"
        },
        Body: {
            shape: {
                type: "blob"
            },
            streaming: true
        },
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        CacheControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Cache-Control"
        },
        ContentDisposition: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Disposition"
        },
        ContentEncoding: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Encoding"
        },
        ContentLanguage: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Language"
        },
        ContentLength: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "Content-Length"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        ContentType: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-Type"
        },
        Expires: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "Expires"
        },
        GrantFullControl: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-full-control"
        },
        GrantRead: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read"
        },
        GrantReadACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-read-acp"
        },
        GrantWriteACP: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-grant-write-acp"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        Metadata: {
            shape: _Metadata_1._Metadata,
            location: "headers",
            locationName: "x-amz-meta-"
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        StorageClass: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-storage-class"
        },
        WebsiteRedirectLocation: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-website-redirect-location"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        },
        Tagging: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-tagging"
        }
    },
    payload: "Body"
};
//# sourceMappingURL=PutObjectInput.js.map

/***/ }),

/***/ 31463:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutObjectOutput = {
    type: "structure",
    required: [],
    members: {
        Expiration: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-expiration"
        },
        ETag: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "ETag"
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=PutObjectOutput.js.map

/***/ }),

/***/ 33987:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var PutObjectTaggingInput_1 = __webpack_require__(63508);
var PutObjectTaggingOutput_1 = __webpack_require__(2296);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.PutObjectTagging = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "PutObjectTagging",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}/{Key+}?tagging"
    },
    input: {
        shape: PutObjectTaggingInput_1.PutObjectTaggingInput
    },
    output: {
        shape: PutObjectTaggingOutput_1.PutObjectTaggingOutput
    },
    errors: []
};
//# sourceMappingURL=PutObjectTagging.js.map

/***/ }),

/***/ 63508:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Tagging_1 = __webpack_require__(71613);
exports.PutObjectTaggingInput = {
    type: "structure",
    required: ["Bucket", "Key", "Tagging"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        Tagging: {
            shape: _Tagging_1._Tagging,
            locationName: "Tagging",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        }
    },
    payload: "Tagging"
};
//# sourceMappingURL=PutObjectTaggingInput.js.map

/***/ }),

/***/ 2296:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PutObjectTaggingOutput = {
    type: "structure",
    required: [],
    members: {
        VersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-version-id"
        }
    }
};
//# sourceMappingURL=PutObjectTaggingOutput.js.map

/***/ }),

/***/ 31488:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var RestoreObjectInput_1 = __webpack_require__(23872);
var RestoreObjectOutput_1 = __webpack_require__(27748);
var ObjectAlreadyInActiveTierError_1 = __webpack_require__(31555);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.RestoreObject = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "RestoreObject",
    http: {
        method: "POST",
        requestUri: "/{Bucket}/{Key+}?restore"
    },
    input: {
        shape: RestoreObjectInput_1.RestoreObjectInput
    },
    output: {
        shape: RestoreObjectOutput_1.RestoreObjectOutput
    },
    errors: [
        {
            shape: ObjectAlreadyInActiveTierError_1.ObjectAlreadyInActiveTierError
        }
    ]
};
//# sourceMappingURL=RestoreObject.js.map

/***/ }),

/***/ 23872:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _RestoreRequest_1 = __webpack_require__(57094);
exports.RestoreObjectInput = {
    type: "structure",
    required: ["Bucket", "Key"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        VersionId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "versionId"
        },
        RestoreRequest: {
            shape: _RestoreRequest_1._RestoreRequest,
            locationName: "RestoreRequest",
            xmlNamespace: {
                uri: "http://s3.amazonaws.com/doc/2006-03-01/"
            }
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    },
    payload: "RestoreRequest"
};
//# sourceMappingURL=RestoreObjectInput.js.map

/***/ }),

/***/ 27748:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RestoreObjectOutput = {
    type: "structure",
    required: [],
    members: {
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        },
        RestoreOutputPath: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-restore-output-path"
        }
    }
};
//# sourceMappingURL=RestoreObjectOutput.js.map

/***/ }),

/***/ 91223:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var SelectObjectContentInput_1 = __webpack_require__(46713);
var SelectObjectContentOutput_1 = __webpack_require__(55868);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.SelectObjectContent = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "SelectObjectContent",
    http: {
        method: "POST",
        requestUri: "/{Bucket}/{Key+}?select&select-type=2"
    },
    input: {
        shape: SelectObjectContentInput_1.SelectObjectContentInput,
        locationName: "SelectObjectContentRequest",
        xmlNamespace: {
            uri: "http://s3.amazonaws.com/doc/2006-03-01/"
        }
    },
    output: {
        shape: SelectObjectContentOutput_1.SelectObjectContentOutput
    },
    errors: []
};
//# sourceMappingURL=SelectObjectContent.js.map

/***/ }),

/***/ 46713:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _RequestProgress_1 = __webpack_require__(61828);
var _InputSerialization_1 = __webpack_require__(71651);
var _OutputSerialization_1 = __webpack_require__(63173);
exports.SelectObjectContentInput = {
    type: "structure",
    required: [
        "Bucket",
        "Key",
        "Expression",
        "ExpressionType",
        "InputSerialization",
        "OutputSerialization"
    ],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        Expression: {
            shape: {
                type: "string"
            }
        },
        ExpressionType: {
            shape: {
                type: "string"
            }
        },
        RequestProgress: {
            shape: _RequestProgress_1._RequestProgress
        },
        InputSerialization: {
            shape: _InputSerialization_1._InputSerialization
        },
        OutputSerialization: {
            shape: _OutputSerialization_1._OutputSerialization
        }
    }
};
//# sourceMappingURL=SelectObjectContentInput.js.map

/***/ }),

/***/ 55868:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _SelectObjectContentEventStream_1 = __webpack_require__(22817);
exports.SelectObjectContentOutput = {
    type: "structure",
    required: [],
    members: {
        Payload: {
            shape: _SelectObjectContentEventStream_1._SelectObjectContentEventStream
        }
    },
    payload: "Payload"
};
//# sourceMappingURL=SelectObjectContentOutput.js.map

/***/ }),

/***/ 86326:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ServiceMetadata = {
    apiVersion: "2006-03-01",
    endpointPrefix: "s3",
    protocol: "rest-xml",
    serviceAbbreviation: "Amazon S3",
    serviceFullName: "Amazon Simple Storage Service",
    serviceId: "S3",
    signatureVersion: "s3",
    uid: "s3-2006-03-01"
};
exports.clientVersion = "0.1.0-preview.1";
//# sourceMappingURL=ServiceMetadata.js.map

/***/ }),

/***/ 27777:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var UploadPartInput_1 = __webpack_require__(33489);
var UploadPartOutput_1 = __webpack_require__(58441);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.UploadPart = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "UploadPart",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: UploadPartInput_1.UploadPartInput
    },
    output: {
        shape: UploadPartOutput_1.UploadPartOutput
    },
    errors: []
};
//# sourceMappingURL=UploadPart.js.map

/***/ }),

/***/ 71869:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var UploadPartCopyInput_1 = __webpack_require__(15938);
var UploadPartCopyOutput_1 = __webpack_require__(23953);
var ServiceMetadata_1 = __webpack_require__(86326);
exports.UploadPartCopy = {
    metadata: ServiceMetadata_1.ServiceMetadata,
    name: "UploadPartCopy",
    http: {
        method: "PUT",
        requestUri: "/{Bucket}/{Key+}"
    },
    input: {
        shape: UploadPartCopyInput_1.UploadPartCopyInput
    },
    output: {
        shape: UploadPartCopyOutput_1.UploadPartCopyOutput
    },
    errors: []
};
//# sourceMappingURL=UploadPartCopy.js.map

/***/ }),

/***/ 15938:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadPartCopyInput = {
    type: "structure",
    required: ["Bucket", "CopySource", "Key", "PartNumber", "UploadId"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        CopySource: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source"
        },
        CopySourceIfMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-match"
        },
        CopySourceIfModifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-modified-since"
        },
        CopySourceIfNoneMatch: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-none-match"
        },
        CopySourceIfUnmodifiedSince: {
            shape: {
                type: "timestamp"
            },
            location: "header",
            locationName: "x-amz-copy-source-if-unmodified-since"
        },
        CopySourceRange: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-range"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        PartNumber: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "partNumber"
        },
        UploadId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "uploadId"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        CopySourceSSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-server-side-encryption-customer-algorithm"
        },
        CopySourceSSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-copy-source-server-side-encryption-customer-key"
        },
        CopySourceSSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-server-side-encryption-customer-key-MD5"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    }
};
//# sourceMappingURL=UploadPartCopyInput.js.map

/***/ }),

/***/ 23953:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CopyPartResult_1 = __webpack_require__(32732);
exports.UploadPartCopyOutput = {
    type: "structure",
    required: [],
    members: {
        CopySourceVersionId: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-copy-source-version-id"
        },
        CopyPartResult: {
            shape: _CopyPartResult_1._CopyPartResult
        },
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    },
    payload: "CopyPartResult"
};
//# sourceMappingURL=UploadPartCopyOutput.js.map

/***/ }),

/***/ 33489:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadPartInput = {
    type: "structure",
    required: ["Bucket", "Key", "PartNumber", "UploadId"],
    members: {
        Body: {
            shape: {
                type: "blob"
            },
            streaming: true
        },
        Bucket: {
            shape: {
                type: "string"
            },
            location: "uri",
            locationName: "Bucket"
        },
        ContentLength: {
            shape: {
                type: "integer"
            },
            location: "header",
            locationName: "Content-Length"
        },
        ContentMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "Content-MD5"
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            },
            location: "uri",
            locationName: "Key"
        },
        PartNumber: {
            shape: {
                type: "integer"
            },
            location: "querystring",
            locationName: "partNumber"
        },
        UploadId: {
            shape: {
                type: "string"
            },
            location: "querystring",
            locationName: "uploadId"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKey: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        RequestPayer: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-payer"
        }
    },
    payload: "Body"
};
//# sourceMappingURL=UploadPartInput.js.map

/***/ }),

/***/ 58441:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadPartOutput = {
    type: "structure",
    required: [],
    members: {
        ServerSideEncryption: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption"
        },
        ETag: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "ETag"
        },
        SSECustomerAlgorithm: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-algorithm"
        },
        SSECustomerKeyMD5: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-customer-key-MD5"
        },
        SSEKMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            },
            location: "header",
            locationName: "x-amz-server-side-encryption-aws-kms-key-id"
        },
        RequestCharged: {
            shape: {
                type: "string"
            },
            location: "header",
            locationName: "x-amz-request-charged"
        }
    }
};
//# sourceMappingURL=UploadPartOutput.js.map

/***/ }),

/***/ 93639:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._AbortIncompleteMultipartUpload = {
    type: "structure",
    required: [],
    members: {
        DaysAfterInitiation: {
            shape: {
                type: "integer"
            }
        }
    }
};
//# sourceMappingURL=_AbortIncompleteMultipartUpload.js.map

/***/ }),

/***/ 62990:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._AccelerateConfiguration = {
    type: "structure",
    required: [],
    members: {
        Status: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_AccelerateConfiguration.js.map

/***/ }),

/***/ 23864:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Grants_1 = __webpack_require__(50781);
var _Owner_1 = __webpack_require__(17885);
exports._AccessControlPolicy = {
    type: "structure",
    required: [],
    members: {
        Grants: {
            shape: _Grants_1._Grants,
            locationName: "AccessControlList"
        },
        Owner: {
            shape: _Owner_1._Owner
        }
    }
};
//# sourceMappingURL=_AccessControlPolicy.js.map

/***/ }),

/***/ 64547:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._AccessControlTranslation = {
    type: "structure",
    required: ["Owner"],
    members: {
        Owner: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_AccessControlTranslation.js.map

/***/ }),

/***/ 70414:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._AllowedHeaders = {
    type: "list",
    flattened: true,
    member: {
        shape: {
            type: "string"
        }
    }
};
//# sourceMappingURL=_AllowedHeaders.js.map

/***/ }),

/***/ 79622:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._AllowedMethods = {
    type: "list",
    flattened: true,
    member: {
        shape: {
            type: "string"
        }
    }
};
//# sourceMappingURL=_AllowedMethods.js.map

/***/ }),

/***/ 8445:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._AllowedOrigins = {
    type: "list",
    flattened: true,
    member: {
        shape: {
            type: "string"
        }
    }
};
//# sourceMappingURL=_AllowedOrigins.js.map

/***/ }),

/***/ 53258:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TagSet_1 = __webpack_require__(66620);
exports._AnalyticsAndOperator = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tags: {
            shape: _TagSet_1._TagSet,
            flattened: true,
            locationName: "Tag"
        }
    }
};
//# sourceMappingURL=_AnalyticsAndOperator.js.map

/***/ }),

/***/ 18491:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AnalyticsFilter_1 = __webpack_require__(97631);
var _StorageClassAnalysis_1 = __webpack_require__(46600);
exports._AnalyticsConfiguration = {
    type: "structure",
    required: ["Id", "StorageClassAnalysis"],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        Filter: {
            shape: _AnalyticsFilter_1._AnalyticsFilter
        },
        StorageClassAnalysis: {
            shape: _StorageClassAnalysis_1._StorageClassAnalysis
        }
    }
};
//# sourceMappingURL=_AnalyticsConfiguration.js.map

/***/ }),

/***/ 75383:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AnalyticsConfiguration_1 = __webpack_require__(18491);
exports._AnalyticsConfigurationList = {
    type: "list",
    flattened: true,
    member: {
        shape: _AnalyticsConfiguration_1._AnalyticsConfiguration
    }
};
//# sourceMappingURL=_AnalyticsConfigurationList.js.map

/***/ }),

/***/ 84659:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AnalyticsS3BucketDestination_1 = __webpack_require__(58679);
exports._AnalyticsExportDestination = {
    type: "structure",
    required: ["S3BucketDestination"],
    members: {
        S3BucketDestination: {
            shape: _AnalyticsS3BucketDestination_1._AnalyticsS3BucketDestination
        }
    }
};
//# sourceMappingURL=_AnalyticsExportDestination.js.map

/***/ }),

/***/ 97631:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Tag_1 = __webpack_require__(16322);
var _AnalyticsAndOperator_1 = __webpack_require__(53258);
exports._AnalyticsFilter = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tag: {
            shape: _Tag_1._Tag
        },
        And: {
            shape: _AnalyticsAndOperator_1._AnalyticsAndOperator
        }
    }
};
//# sourceMappingURL=_AnalyticsFilter.js.map

/***/ }),

/***/ 58679:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._AnalyticsS3BucketDestination = {
    type: "structure",
    required: ["Format", "Bucket"],
    members: {
        Format: {
            shape: {
                type: "string"
            }
        },
        BucketAccountId: {
            shape: {
                type: "string"
            }
        },
        Bucket: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_AnalyticsS3BucketDestination.js.map

/***/ }),

/***/ 10161:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Bucket = {
    type: "structure",
    required: [],
    members: {
        Name: {
            shape: {
                type: "string"
            }
        },
        CreationDate: {
            shape: {
                type: "timestamp"
            }
        }
    }
};
//# sourceMappingURL=_Bucket.js.map

/***/ }),

/***/ 88672:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LifecycleRules_1 = __webpack_require__(70954);
exports._BucketLifecycleConfiguration = {
    type: "structure",
    required: ["Rules"],
    members: {
        Rules: {
            shape: _LifecycleRules_1._LifecycleRules,
            locationName: "Rule"
        }
    }
};
//# sourceMappingURL=_BucketLifecycleConfiguration.js.map

/***/ }),

/***/ 39903:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LoggingEnabled_1 = __webpack_require__(69205);
exports._BucketLoggingStatus = {
    type: "structure",
    required: [],
    members: {
        LoggingEnabled: {
            shape: _LoggingEnabled_1._LoggingEnabled
        }
    }
};
//# sourceMappingURL=_BucketLoggingStatus.js.map

/***/ }),

/***/ 48456:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Bucket_1 = __webpack_require__(10161);
exports._Buckets = {
    type: "list",
    member: {
        shape: _Bucket_1._Bucket,
        locationName: "Bucket"
    }
};
//# sourceMappingURL=_Buckets.js.map

/***/ }),

/***/ 90688:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CORSRules_1 = __webpack_require__(44387);
exports._CORSConfiguration = {
    type: "structure",
    required: ["CORSRules"],
    members: {
        CORSRules: {
            shape: _CORSRules_1._CORSRules,
            locationName: "CORSRule"
        }
    }
};
//# sourceMappingURL=_CORSConfiguration.js.map

/***/ }),

/***/ 44087:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AllowedHeaders_1 = __webpack_require__(70414);
var _AllowedMethods_1 = __webpack_require__(79622);
var _AllowedOrigins_1 = __webpack_require__(8445);
var _ExposeHeaders_1 = __webpack_require__(64995);
exports._CORSRule = {
    type: "structure",
    required: ["AllowedMethods", "AllowedOrigins"],
    members: {
        AllowedHeaders: {
            shape: _AllowedHeaders_1._AllowedHeaders,
            locationName: "AllowedHeader"
        },
        AllowedMethods: {
            shape: _AllowedMethods_1._AllowedMethods,
            locationName: "AllowedMethod"
        },
        AllowedOrigins: {
            shape: _AllowedOrigins_1._AllowedOrigins,
            locationName: "AllowedOrigin"
        },
        ExposeHeaders: {
            shape: _ExposeHeaders_1._ExposeHeaders,
            locationName: "ExposeHeader"
        },
        MaxAgeSeconds: {
            shape: {
                type: "integer"
            }
        }
    }
};
//# sourceMappingURL=_CORSRule.js.map

/***/ }),

/***/ 44387:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CORSRule_1 = __webpack_require__(44087);
exports._CORSRules = {
    type: "list",
    flattened: true,
    member: {
        shape: _CORSRule_1._CORSRule
    }
};
//# sourceMappingURL=_CORSRules.js.map

/***/ }),

/***/ 71158:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._CSVInput = {
    type: "structure",
    required: [],
    members: {
        FileHeaderInfo: {
            shape: {
                type: "string"
            }
        },
        Comments: {
            shape: {
                type: "string"
            }
        },
        QuoteEscapeCharacter: {
            shape: {
                type: "string"
            }
        },
        RecordDelimiter: {
            shape: {
                type: "string"
            }
        },
        FieldDelimiter: {
            shape: {
                type: "string"
            }
        },
        QuoteCharacter: {
            shape: {
                type: "string"
            }
        },
        AllowQuotedRecordDelimiter: {
            shape: {
                type: "boolean"
            }
        }
    }
};
//# sourceMappingURL=_CSVInput.js.map

/***/ }),

/***/ 96767:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._CSVOutput = {
    type: "structure",
    required: [],
    members: {
        QuoteFields: {
            shape: {
                type: "string"
            }
        },
        QuoteEscapeCharacter: {
            shape: {
                type: "string"
            }
        },
        RecordDelimiter: {
            shape: {
                type: "string"
            }
        },
        FieldDelimiter: {
            shape: {
                type: "string"
            }
        },
        QuoteCharacter: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_CSVOutput.js.map

/***/ }),

/***/ 57182:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _EventList_1 = __webpack_require__(36031);
exports._CloudFunctionConfiguration = {
    type: "structure",
    required: [],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        Event: {
            shape: {
                type: "string"
            }
        },
        Events: {
            shape: _EventList_1._EventList,
            locationName: "Event"
        },
        CloudFunction: {
            shape: {
                type: "string"
            }
        },
        InvocationRole: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_CloudFunctionConfiguration.js.map

/***/ }),

/***/ 47187:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._CommonPrefix = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_CommonPrefix.js.map

/***/ }),

/***/ 41186:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CommonPrefix_1 = __webpack_require__(47187);
exports._CommonPrefixList = {
    type: "list",
    flattened: true,
    member: {
        shape: _CommonPrefix_1._CommonPrefix
    }
};
//# sourceMappingURL=_CommonPrefixList.js.map

/***/ }),

/***/ 71853:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CompletedPartList_1 = __webpack_require__(57763);
exports._CompletedMultipartUpload = {
    type: "structure",
    required: [],
    members: {
        Parts: {
            shape: _CompletedPartList_1._CompletedPartList,
            locationName: "Part"
        }
    }
};
//# sourceMappingURL=_CompletedMultipartUpload.js.map

/***/ }),

/***/ 36515:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._CompletedPart = {
    type: "structure",
    required: [],
    members: {
        ETag: {
            shape: {
                type: "string"
            }
        },
        PartNumber: {
            shape: {
                type: "integer"
            }
        }
    }
};
//# sourceMappingURL=_CompletedPart.js.map

/***/ }),

/***/ 57763:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CompletedPart_1 = __webpack_require__(36515);
exports._CompletedPartList = {
    type: "list",
    flattened: true,
    member: {
        shape: _CompletedPart_1._CompletedPart
    }
};
//# sourceMappingURL=_CompletedPartList.js.map

/***/ }),

/***/ 80938:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Condition = {
    type: "structure",
    required: [],
    members: {
        HttpErrorCodeReturnedEquals: {
            shape: {
                type: "string"
            }
        },
        KeyPrefixEquals: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Condition.js.map

/***/ }),

/***/ 22350:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._ContinuationEvent = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=_ContinuationEvent.js.map

/***/ }),

/***/ 54802:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._CopyObjectResult = {
    type: "structure",
    required: [],
    members: {
        ETag: {
            shape: {
                type: "string"
            }
        },
        LastModified: {
            shape: {
                type: "timestamp"
            }
        }
    }
};
//# sourceMappingURL=_CopyObjectResult.js.map

/***/ }),

/***/ 32732:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._CopyPartResult = {
    type: "structure",
    required: [],
    members: {
        ETag: {
            shape: {
                type: "string"
            }
        },
        LastModified: {
            shape: {
                type: "timestamp"
            }
        }
    }
};
//# sourceMappingURL=_CopyPartResult.js.map

/***/ }),

/***/ 17053:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._CreateBucketConfiguration = {
    type: "structure",
    required: [],
    members: {
        LocationConstraint: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_CreateBucketConfiguration.js.map

/***/ }),

/***/ 80578:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ObjectIdentifierList_1 = __webpack_require__(69972);
exports._Delete = {
    type: "structure",
    required: ["Objects"],
    members: {
        Objects: {
            shape: _ObjectIdentifierList_1._ObjectIdentifierList,
            locationName: "Object"
        },
        Quiet: {
            shape: {
                type: "boolean"
            }
        }
    }
};
//# sourceMappingURL=_Delete.js.map

/***/ }),

/***/ 67353:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Owner_1 = __webpack_require__(17885);
exports._DeleteMarkerEntry = {
    type: "structure",
    required: [],
    members: {
        Owner: {
            shape: _Owner_1._Owner
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        VersionId: {
            shape: {
                type: "string"
            }
        },
        IsLatest: {
            shape: {
                type: "boolean"
            }
        },
        LastModified: {
            shape: {
                type: "timestamp"
            }
        }
    }
};
//# sourceMappingURL=_DeleteMarkerEntry.js.map

/***/ }),

/***/ 80386:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._DeleteMarkerReplication = {
    type: "structure",
    required: [],
    members: {
        Status: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_DeleteMarkerReplication.js.map

/***/ }),

/***/ 65957:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _DeleteMarkerEntry_1 = __webpack_require__(67353);
exports._DeleteMarkers = {
    type: "list",
    flattened: true,
    member: {
        shape: _DeleteMarkerEntry_1._DeleteMarkerEntry
    }
};
//# sourceMappingURL=_DeleteMarkers.js.map

/***/ }),

/***/ 34824:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._DeletedObject = {
    type: "structure",
    required: [],
    members: {
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        VersionId: {
            shape: {
                type: "string"
            }
        },
        DeleteMarker: {
            shape: {
                type: "boolean"
            }
        },
        DeleteMarkerVersionId: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_DeletedObject.js.map

/***/ }),

/***/ 14945:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _DeletedObject_1 = __webpack_require__(34824);
exports._DeletedObjects = {
    type: "list",
    flattened: true,
    member: {
        shape: _DeletedObject_1._DeletedObject
    }
};
//# sourceMappingURL=_DeletedObjects.js.map

/***/ }),

/***/ 65749:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AccessControlTranslation_1 = __webpack_require__(64547);
var _EncryptionConfiguration_1 = __webpack_require__(29014);
exports._Destination = {
    type: "structure",
    required: ["Bucket"],
    members: {
        Bucket: {
            shape: {
                type: "string"
            }
        },
        Account: {
            shape: {
                type: "string"
            }
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        },
        AccessControlTranslation: {
            shape: _AccessControlTranslation_1._AccessControlTranslation
        },
        EncryptionConfiguration: {
            shape: _EncryptionConfiguration_1._EncryptionConfiguration
        }
    }
};
//# sourceMappingURL=_Destination.js.map

/***/ }),

/***/ 38672:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Encryption = {
    type: "structure",
    required: ["EncryptionType"],
    members: {
        EncryptionType: {
            shape: {
                type: "string"
            }
        },
        KMSKeyId: {
            shape: {
                type: "string",
                sensitive: true
            }
        },
        KMSContext: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Encryption.js.map

/***/ }),

/***/ 29014:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._EncryptionConfiguration = {
    type: "structure",
    required: [],
    members: {
        ReplicaKmsKeyID: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_EncryptionConfiguration.js.map

/***/ }),

/***/ 26147:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._EndEvent = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=_EndEvent.js.map

/***/ }),

/***/ 91254:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Error = {
    type: "structure",
    required: [],
    members: {
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        VersionId: {
            shape: {
                type: "string"
            }
        },
        Code: {
            shape: {
                type: "string"
            }
        },
        Message: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Error.js.map

/***/ }),

/***/ 39139:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._ErrorDocument = {
    type: "structure",
    required: ["Key"],
    members: {
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        }
    }
};
//# sourceMappingURL=_ErrorDocument.js.map

/***/ }),

/***/ 37226:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Error_1 = __webpack_require__(91254);
exports._Errors = {
    type: "list",
    flattened: true,
    member: {
        shape: _Error_1._Error
    }
};
//# sourceMappingURL=_Errors.js.map

/***/ }),

/***/ 36031:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._EventList = {
    type: "list",
    flattened: true,
    member: {
        shape: {
            type: "string"
        }
    }
};
//# sourceMappingURL=_EventList.js.map

/***/ }),

/***/ 64995:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._ExposeHeaders = {
    type: "list",
    flattened: true,
    member: {
        shape: {
            type: "string"
        }
    }
};
//# sourceMappingURL=_ExposeHeaders.js.map

/***/ }),

/***/ 65567:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._FilterRule = {
    type: "structure",
    required: [],
    members: {
        Name: {
            shape: {
                type: "string"
            }
        },
        Value: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_FilterRule.js.map

/***/ }),

/***/ 94102:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _FilterRule_1 = __webpack_require__(65567);
exports._FilterRuleList = {
    type: "list",
    flattened: true,
    member: {
        shape: _FilterRule_1._FilterRule
    }
};
//# sourceMappingURL=_FilterRuleList.js.map

/***/ }),

/***/ 54177:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._GlacierJobParameters = {
    type: "structure",
    required: ["Tier"],
    members: {
        Tier: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_GlacierJobParameters.js.map

/***/ }),

/***/ 69483:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Grantee_1 = __webpack_require__(64895);
exports._Grant = {
    type: "structure",
    required: [],
    members: {
        Grantee: {
            shape: _Grantee_1._Grantee
        },
        Permission: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Grant.js.map

/***/ }),

/***/ 64895:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Grantee = {
    type: "structure",
    required: ["Type"],
    members: {
        DisplayName: {
            shape: {
                type: "string"
            }
        },
        EmailAddress: {
            shape: {
                type: "string"
            }
        },
        ID: {
            shape: {
                type: "string"
            }
        },
        Type: {
            shape: {
                type: "string"
            },
            locationName: "xsi:type",
            xmlAttribute: true
        },
        URI: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Grantee.js.map

/***/ }),

/***/ 50781:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Grant_1 = __webpack_require__(69483);
exports._Grants = {
    type: "list",
    member: {
        shape: _Grant_1._Grant,
        locationName: "Grant"
    }
};
//# sourceMappingURL=_Grants.js.map

/***/ }),

/***/ 3447:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._IndexDocument = {
    type: "structure",
    required: ["Suffix"],
    members: {
        Suffix: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_IndexDocument.js.map

/***/ }),

/***/ 93083:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Initiator = {
    type: "structure",
    required: [],
    members: {
        ID: {
            shape: {
                type: "string"
            }
        },
        DisplayName: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Initiator.js.map

/***/ }),

/***/ 71651:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CSVInput_1 = __webpack_require__(71158);
var _JSONInput_1 = __webpack_require__(7694);
var _ParquetInput_1 = __webpack_require__(6683);
exports._InputSerialization = {
    type: "structure",
    required: [],
    members: {
        CSV: {
            shape: _CSVInput_1._CSVInput
        },
        CompressionType: {
            shape: {
                type: "string"
            }
        },
        JSON: {
            shape: _JSONInput_1._JSONInput
        },
        Parquet: {
            shape: _ParquetInput_1._ParquetInput
        }
    }
};
//# sourceMappingURL=_InputSerialization.js.map

/***/ }),

/***/ 27890:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InventoryDestination_1 = __webpack_require__(90844);
var _InventoryFilter_1 = __webpack_require__(90568);
var _InventoryOptionalFields_1 = __webpack_require__(49058);
var _InventorySchedule_1 = __webpack_require__(53702);
exports._InventoryConfiguration = {
    type: "structure",
    required: [
        "Destination",
        "IsEnabled",
        "Id",
        "IncludedObjectVersions",
        "Schedule"
    ],
    members: {
        Destination: {
            shape: _InventoryDestination_1._InventoryDestination
        },
        IsEnabled: {
            shape: {
                type: "boolean"
            }
        },
        Filter: {
            shape: _InventoryFilter_1._InventoryFilter
        },
        Id: {
            shape: {
                type: "string"
            }
        },
        IncludedObjectVersions: {
            shape: {
                type: "string"
            }
        },
        OptionalFields: {
            shape: _InventoryOptionalFields_1._InventoryOptionalFields
        },
        Schedule: {
            shape: _InventorySchedule_1._InventorySchedule
        }
    }
};
//# sourceMappingURL=_InventoryConfiguration.js.map

/***/ }),

/***/ 69146:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InventoryConfiguration_1 = __webpack_require__(27890);
exports._InventoryConfigurationList = {
    type: "list",
    flattened: true,
    member: {
        shape: _InventoryConfiguration_1._InventoryConfiguration
    }
};
//# sourceMappingURL=_InventoryConfigurationList.js.map

/***/ }),

/***/ 90844:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InventoryS3BucketDestination_1 = __webpack_require__(40655);
exports._InventoryDestination = {
    type: "structure",
    required: ["S3BucketDestination"],
    members: {
        S3BucketDestination: {
            shape: _InventoryS3BucketDestination_1._InventoryS3BucketDestination
        }
    }
};
//# sourceMappingURL=_InventoryDestination.js.map

/***/ }),

/***/ 34564:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _SSES3_1 = __webpack_require__(8801);
var _SSEKMS_1 = __webpack_require__(75969);
exports._InventoryEncryption = {
    type: "structure",
    required: [],
    members: {
        SSES3: {
            shape: _SSES3_1._SSES3,
            locationName: "SSE-S3"
        },
        SSEKMS: {
            shape: _SSEKMS_1._SSEKMS,
            locationName: "SSE-KMS"
        }
    }
};
//# sourceMappingURL=_InventoryEncryption.js.map

/***/ }),

/***/ 90568:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._InventoryFilter = {
    type: "structure",
    required: ["Prefix"],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_InventoryFilter.js.map

/***/ }),

/***/ 49058:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._InventoryOptionalFields = {
    type: "list",
    member: {
        shape: {
            type: "string"
        },
        locationName: "Field"
    }
};
//# sourceMappingURL=_InventoryOptionalFields.js.map

/***/ }),

/***/ 40655:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InventoryEncryption_1 = __webpack_require__(34564);
exports._InventoryS3BucketDestination = {
    type: "structure",
    required: ["Bucket", "Format"],
    members: {
        AccountId: {
            shape: {
                type: "string"
            }
        },
        Bucket: {
            shape: {
                type: "string"
            }
        },
        Format: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Encryption: {
            shape: _InventoryEncryption_1._InventoryEncryption
        }
    }
};
//# sourceMappingURL=_InventoryS3BucketDestination.js.map

/***/ }),

/***/ 53702:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._InventorySchedule = {
    type: "structure",
    required: ["Frequency"],
    members: {
        Frequency: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_InventorySchedule.js.map

/***/ }),

/***/ 7694:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._JSONInput = {
    type: "structure",
    required: [],
    members: {
        Type: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_JSONInput.js.map

/***/ }),

/***/ 71901:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._JSONOutput = {
    type: "structure",
    required: [],
    members: {
        RecordDelimiter: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_JSONOutput.js.map

/***/ }),

/***/ 32670:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _EventList_1 = __webpack_require__(36031);
var _NotificationConfigurationFilter_1 = __webpack_require__(43446);
exports._LambdaFunctionConfiguration = {
    type: "structure",
    required: ["LambdaFunctionArn", "Events"],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        LambdaFunctionArn: {
            shape: {
                type: "string"
            },
            locationName: "CloudFunction"
        },
        Events: {
            shape: _EventList_1._EventList,
            locationName: "Event"
        },
        Filter: {
            shape: _NotificationConfigurationFilter_1._NotificationConfigurationFilter
        }
    }
};
//# sourceMappingURL=_LambdaFunctionConfiguration.js.map

/***/ }),

/***/ 56091:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LambdaFunctionConfiguration_1 = __webpack_require__(32670);
exports._LambdaFunctionConfigurationList = {
    type: "list",
    flattened: true,
    member: {
        shape: _LambdaFunctionConfiguration_1._LambdaFunctionConfiguration
    }
};
//# sourceMappingURL=_LambdaFunctionConfigurationList.js.map

/***/ }),

/***/ 34018:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Rules_1 = __webpack_require__(30169);
exports._LifecycleConfiguration = {
    type: "structure",
    required: ["Rules"],
    members: {
        Rules: {
            shape: _Rules_1._Rules,
            locationName: "Rule"
        }
    }
};
//# sourceMappingURL=_LifecycleConfiguration.js.map

/***/ }),

/***/ 50123:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._LifecycleExpiration = {
    type: "structure",
    required: [],
    members: {
        Date: {
            shape: {
                type: "timestamp",
                timestampFormat: "iso8601"
            }
        },
        Days: {
            shape: {
                type: "integer"
            }
        },
        ExpiredObjectDeleteMarker: {
            shape: {
                type: "boolean"
            }
        }
    }
};
//# sourceMappingURL=_LifecycleExpiration.js.map

/***/ }),

/***/ 41085:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LifecycleExpiration_1 = __webpack_require__(50123);
var _LifecycleRuleFilter_1 = __webpack_require__(48863);
var _TransitionList_1 = __webpack_require__(69220);
var _NoncurrentVersionTransitionList_1 = __webpack_require__(38461);
var _NoncurrentVersionExpiration_1 = __webpack_require__(64086);
var _AbortIncompleteMultipartUpload_1 = __webpack_require__(93639);
exports._LifecycleRule = {
    type: "structure",
    required: ["Status"],
    members: {
        Expiration: {
            shape: _LifecycleExpiration_1._LifecycleExpiration
        },
        ID: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Filter: {
            shape: _LifecycleRuleFilter_1._LifecycleRuleFilter
        },
        Status: {
            shape: {
                type: "string"
            }
        },
        Transitions: {
            shape: _TransitionList_1._TransitionList,
            locationName: "Transition"
        },
        NoncurrentVersionTransitions: {
            shape: _NoncurrentVersionTransitionList_1._NoncurrentVersionTransitionList,
            locationName: "NoncurrentVersionTransition"
        },
        NoncurrentVersionExpiration: {
            shape: _NoncurrentVersionExpiration_1._NoncurrentVersionExpiration
        },
        AbortIncompleteMultipartUpload: {
            shape: _AbortIncompleteMultipartUpload_1._AbortIncompleteMultipartUpload
        }
    }
};
//# sourceMappingURL=_LifecycleRule.js.map

/***/ }),

/***/ 37760:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TagSet_1 = __webpack_require__(66620);
exports._LifecycleRuleAndOperator = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tags: {
            shape: _TagSet_1._TagSet,
            flattened: true,
            locationName: "Tag"
        }
    }
};
//# sourceMappingURL=_LifecycleRuleAndOperator.js.map

/***/ }),

/***/ 48863:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Tag_1 = __webpack_require__(16322);
var _LifecycleRuleAndOperator_1 = __webpack_require__(37760);
exports._LifecycleRuleFilter = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tag: {
            shape: _Tag_1._Tag
        },
        And: {
            shape: _LifecycleRuleAndOperator_1._LifecycleRuleAndOperator
        }
    }
};
//# sourceMappingURL=_LifecycleRuleFilter.js.map

/***/ }),

/***/ 70954:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LifecycleRule_1 = __webpack_require__(41085);
exports._LifecycleRules = {
    type: "list",
    flattened: true,
    member: {
        shape: _LifecycleRule_1._LifecycleRule
    }
};
//# sourceMappingURL=_LifecycleRules.js.map

/***/ }),

/***/ 69205:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TargetGrants_1 = __webpack_require__(34402);
exports._LoggingEnabled = {
    type: "structure",
    required: ["TargetBucket", "TargetPrefix"],
    members: {
        TargetBucket: {
            shape: {
                type: "string"
            }
        },
        TargetGrants: {
            shape: _TargetGrants_1._TargetGrants
        },
        TargetPrefix: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_LoggingEnabled.js.map

/***/ }),

/***/ 43941:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Metadata = {
    type: "map",
    key: {
        shape: {
            type: "string"
        }
    },
    value: {
        shape: {
            type: "string"
        }
    }
};
//# sourceMappingURL=_Metadata.js.map

/***/ }),

/***/ 34727:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._MetadataEntry = {
    type: "structure",
    required: [],
    members: {
        Name: {
            shape: {
                type: "string"
            }
        },
        Value: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_MetadataEntry.js.map

/***/ }),

/***/ 41812:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TagSet_1 = __webpack_require__(66620);
exports._MetricsAndOperator = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tags: {
            shape: _TagSet_1._TagSet,
            flattened: true,
            locationName: "Tag"
        }
    }
};
//# sourceMappingURL=_MetricsAndOperator.js.map

/***/ }),

/***/ 84956:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MetricsFilter_1 = __webpack_require__(15324);
exports._MetricsConfiguration = {
    type: "structure",
    required: ["Id"],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        Filter: {
            shape: _MetricsFilter_1._MetricsFilter
        }
    }
};
//# sourceMappingURL=_MetricsConfiguration.js.map

/***/ }),

/***/ 5685:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MetricsConfiguration_1 = __webpack_require__(84956);
exports._MetricsConfigurationList = {
    type: "list",
    flattened: true,
    member: {
        shape: _MetricsConfiguration_1._MetricsConfiguration
    }
};
//# sourceMappingURL=_MetricsConfigurationList.js.map

/***/ }),

/***/ 15324:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Tag_1 = __webpack_require__(16322);
var _MetricsAndOperator_1 = __webpack_require__(41812);
exports._MetricsFilter = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tag: {
            shape: _Tag_1._Tag
        },
        And: {
            shape: _MetricsAndOperator_1._MetricsAndOperator
        }
    }
};
//# sourceMappingURL=_MetricsFilter.js.map

/***/ }),

/***/ 43332:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Owner_1 = __webpack_require__(17885);
var _Initiator_1 = __webpack_require__(93083);
exports._MultipartUpload = {
    type: "structure",
    required: [],
    members: {
        UploadId: {
            shape: {
                type: "string"
            }
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        Initiated: {
            shape: {
                type: "timestamp"
            }
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        },
        Owner: {
            shape: _Owner_1._Owner
        },
        Initiator: {
            shape: _Initiator_1._Initiator
        }
    }
};
//# sourceMappingURL=_MultipartUpload.js.map

/***/ }),

/***/ 27785:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MultipartUpload_1 = __webpack_require__(43332);
exports._MultipartUploadList = {
    type: "list",
    flattened: true,
    member: {
        shape: _MultipartUpload_1._MultipartUpload
    }
};
//# sourceMappingURL=_MultipartUploadList.js.map

/***/ }),

/***/ 64086:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._NoncurrentVersionExpiration = {
    type: "structure",
    required: [],
    members: {
        NoncurrentDays: {
            shape: {
                type: "integer"
            }
        }
    }
};
//# sourceMappingURL=_NoncurrentVersionExpiration.js.map

/***/ }),

/***/ 48629:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._NoncurrentVersionTransition = {
    type: "structure",
    required: [],
    members: {
        NoncurrentDays: {
            shape: {
                type: "integer"
            }
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_NoncurrentVersionTransition.js.map

/***/ }),

/***/ 38461:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _NoncurrentVersionTransition_1 = __webpack_require__(48629);
exports._NoncurrentVersionTransitionList = {
    type: "list",
    flattened: true,
    member: {
        shape: _NoncurrentVersionTransition_1._NoncurrentVersionTransition
    }
};
//# sourceMappingURL=_NoncurrentVersionTransitionList.js.map

/***/ }),

/***/ 54825:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TopicConfigurationList_1 = __webpack_require__(89504);
var _QueueConfigurationList_1 = __webpack_require__(22643);
var _LambdaFunctionConfigurationList_1 = __webpack_require__(56091);
exports._NotificationConfiguration = {
    type: "structure",
    required: [],
    members: {
        TopicConfigurations: {
            shape: _TopicConfigurationList_1._TopicConfigurationList,
            locationName: "TopicConfiguration"
        },
        QueueConfigurations: {
            shape: _QueueConfigurationList_1._QueueConfigurationList,
            locationName: "QueueConfiguration"
        },
        LambdaFunctionConfigurations: {
            shape: _LambdaFunctionConfigurationList_1._LambdaFunctionConfigurationList,
            locationName: "CloudFunctionConfiguration"
        }
    }
};
//# sourceMappingURL=_NotificationConfiguration.js.map

/***/ }),

/***/ 8569:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TopicConfigurationDeprecated_1 = __webpack_require__(91759);
var _QueueConfigurationDeprecated_1 = __webpack_require__(34259);
var _CloudFunctionConfiguration_1 = __webpack_require__(57182);
exports._NotificationConfigurationDeprecated = {
    type: "structure",
    required: [],
    members: {
        TopicConfiguration: {
            shape: _TopicConfigurationDeprecated_1._TopicConfigurationDeprecated
        },
        QueueConfiguration: {
            shape: _QueueConfigurationDeprecated_1._QueueConfigurationDeprecated
        },
        CloudFunctionConfiguration: {
            shape: _CloudFunctionConfiguration_1._CloudFunctionConfiguration
        }
    }
};
//# sourceMappingURL=_NotificationConfigurationDeprecated.js.map

/***/ }),

/***/ 43446:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _S3KeyFilter_1 = __webpack_require__(64653);
exports._NotificationConfigurationFilter = {
    type: "structure",
    required: [],
    members: {
        Key: {
            shape: _S3KeyFilter_1._S3KeyFilter,
            locationName: "S3Key"
        }
    }
};
//# sourceMappingURL=_NotificationConfigurationFilter.js.map

/***/ }),

/***/ 96676:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Owner_1 = __webpack_require__(17885);
exports._Object = {
    type: "structure",
    required: [],
    members: {
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        LastModified: {
            shape: {
                type: "timestamp"
            }
        },
        ETag: {
            shape: {
                type: "string"
            }
        },
        Size: {
            shape: {
                type: "integer"
            }
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        },
        Owner: {
            shape: _Owner_1._Owner
        }
    }
};
//# sourceMappingURL=_Object.js.map

/***/ }),

/***/ 9181:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._ObjectIdentifier = {
    type: "structure",
    required: ["Key"],
    members: {
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        VersionId: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_ObjectIdentifier.js.map

/***/ }),

/***/ 69972:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ObjectIdentifier_1 = __webpack_require__(9181);
exports._ObjectIdentifierList = {
    type: "list",
    flattened: true,
    member: {
        shape: _ObjectIdentifier_1._ObjectIdentifier
    }
};
//# sourceMappingURL=_ObjectIdentifierList.js.map

/***/ }),

/***/ 35183:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Object_1 = __webpack_require__(96676);
exports._ObjectList = {
    type: "list",
    flattened: true,
    member: {
        shape: _Object_1._Object
    }
};
//# sourceMappingURL=_ObjectList.js.map

/***/ }),

/***/ 54220:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Owner_1 = __webpack_require__(17885);
exports._ObjectVersion = {
    type: "structure",
    required: [],
    members: {
        ETag: {
            shape: {
                type: "string"
            }
        },
        Size: {
            shape: {
                type: "integer"
            }
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        },
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        VersionId: {
            shape: {
                type: "string"
            }
        },
        IsLatest: {
            shape: {
                type: "boolean"
            }
        },
        LastModified: {
            shape: {
                type: "timestamp"
            }
        },
        Owner: {
            shape: _Owner_1._Owner
        }
    }
};
//# sourceMappingURL=_ObjectVersion.js.map

/***/ }),

/***/ 64917:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ObjectVersion_1 = __webpack_require__(54220);
exports._ObjectVersionList = {
    type: "list",
    flattened: true,
    member: {
        shape: _ObjectVersion_1._ObjectVersion
    }
};
//# sourceMappingURL=_ObjectVersionList.js.map

/***/ }),

/***/ 94146:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _S3Location_1 = __webpack_require__(28634);
exports._OutputLocation = {
    type: "structure",
    required: [],
    members: {
        S3: {
            shape: _S3Location_1._S3Location
        }
    }
};
//# sourceMappingURL=_OutputLocation.js.map

/***/ }),

/***/ 63173:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _CSVOutput_1 = __webpack_require__(96767);
var _JSONOutput_1 = __webpack_require__(71901);
exports._OutputSerialization = {
    type: "structure",
    required: [],
    members: {
        CSV: {
            shape: _CSVOutput_1._CSVOutput
        },
        JSON: {
            shape: _JSONOutput_1._JSONOutput
        }
    }
};
//# sourceMappingURL=_OutputSerialization.js.map

/***/ }),

/***/ 17885:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Owner = {
    type: "structure",
    required: [],
    members: {
        DisplayName: {
            shape: {
                type: "string"
            }
        },
        ID: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Owner.js.map

/***/ }),

/***/ 6683:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._ParquetInput = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=_ParquetInput.js.map

/***/ }),

/***/ 75500:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Part = {
    type: "structure",
    required: [],
    members: {
        PartNumber: {
            shape: {
                type: "integer"
            }
        },
        LastModified: {
            shape: {
                type: "timestamp"
            }
        },
        ETag: {
            shape: {
                type: "string"
            }
        },
        Size: {
            shape: {
                type: "integer"
            }
        }
    }
};
//# sourceMappingURL=_Part.js.map

/***/ }),

/***/ 90635:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Part_1 = __webpack_require__(75500);
exports._Parts = {
    type: "list",
    flattened: true,
    member: {
        shape: _Part_1._Part
    }
};
//# sourceMappingURL=_Parts.js.map

/***/ }),

/***/ 62998:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Progress = {
    type: "structure",
    required: [],
    members: {
        BytesScanned: {
            shape: {
                type: "integer"
            }
        },
        BytesProcessed: {
            shape: {
                type: "integer"
            }
        },
        BytesReturned: {
            shape: {
                type: "integer"
            }
        }
    }
};
//# sourceMappingURL=_Progress.js.map

/***/ }),

/***/ 68828:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Progress_1 = __webpack_require__(62998);
exports._ProgressEvent = {
    type: "structure",
    required: [],
    members: {
        Details: {
            shape: _Progress_1._Progress
        }
    }
};
//# sourceMappingURL=_ProgressEvent.js.map

/***/ }),

/***/ 5613:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _EventList_1 = __webpack_require__(36031);
var _NotificationConfigurationFilter_1 = __webpack_require__(43446);
exports._QueueConfiguration = {
    type: "structure",
    required: ["QueueArn", "Events"],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        QueueArn: {
            shape: {
                type: "string"
            },
            locationName: "Queue"
        },
        Events: {
            shape: _EventList_1._EventList,
            locationName: "Event"
        },
        Filter: {
            shape: _NotificationConfigurationFilter_1._NotificationConfigurationFilter
        }
    }
};
//# sourceMappingURL=_QueueConfiguration.js.map

/***/ }),

/***/ 34259:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _EventList_1 = __webpack_require__(36031);
exports._QueueConfigurationDeprecated = {
    type: "structure",
    required: [],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        Event: {
            shape: {
                type: "string"
            }
        },
        Events: {
            shape: _EventList_1._EventList,
            locationName: "Event"
        },
        Queue: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_QueueConfigurationDeprecated.js.map

/***/ }),

/***/ 22643:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _QueueConfiguration_1 = __webpack_require__(5613);
exports._QueueConfigurationList = {
    type: "list",
    flattened: true,
    member: {
        shape: _QueueConfiguration_1._QueueConfiguration
    }
};
//# sourceMappingURL=_QueueConfigurationList.js.map

/***/ }),

/***/ 98119:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._RecordsEvent = {
    type: "structure",
    required: [],
    members: {
        Payload: {
            shape: {
                type: "blob"
            }
        }
    }
};
//# sourceMappingURL=_RecordsEvent.js.map

/***/ }),

/***/ 98533:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Redirect = {
    type: "structure",
    required: [],
    members: {
        HostName: {
            shape: {
                type: "string"
            }
        },
        HttpRedirectCode: {
            shape: {
                type: "string"
            }
        },
        Protocol: {
            shape: {
                type: "string"
            }
        },
        ReplaceKeyPrefixWith: {
            shape: {
                type: "string"
            }
        },
        ReplaceKeyWith: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Redirect.js.map

/***/ }),

/***/ 32299:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._RedirectAllRequestsTo = {
    type: "structure",
    required: ["HostName"],
    members: {
        HostName: {
            shape: {
                type: "string"
            }
        },
        Protocol: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_RedirectAllRequestsTo.js.map

/***/ }),

/***/ 73783:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ReplicationRules_1 = __webpack_require__(95586);
exports._ReplicationConfiguration = {
    type: "structure",
    required: ["Role", "Rules"],
    members: {
        Role: {
            shape: {
                type: "string"
            }
        },
        Rules: {
            shape: _ReplicationRules_1._ReplicationRules,
            locationName: "Rule"
        }
    }
};
//# sourceMappingURL=_ReplicationConfiguration.js.map

/***/ }),

/***/ 94294:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ReplicationRuleFilter_1 = __webpack_require__(54308);
var _SourceSelectionCriteria_1 = __webpack_require__(10247);
var _Destination_1 = __webpack_require__(65749);
var _DeleteMarkerReplication_1 = __webpack_require__(80386);
exports._ReplicationRule = {
    type: "structure",
    required: ["Status", "Destination"],
    members: {
        ID: {
            shape: {
                type: "string"
            }
        },
        Priority: {
            shape: {
                type: "integer"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Filter: {
            shape: _ReplicationRuleFilter_1._ReplicationRuleFilter
        },
        Status: {
            shape: {
                type: "string"
            }
        },
        SourceSelectionCriteria: {
            shape: _SourceSelectionCriteria_1._SourceSelectionCriteria
        },
        Destination: {
            shape: _Destination_1._Destination
        },
        DeleteMarkerReplication: {
            shape: _DeleteMarkerReplication_1._DeleteMarkerReplication
        }
    }
};
//# sourceMappingURL=_ReplicationRule.js.map

/***/ }),

/***/ 62995:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TagSet_1 = __webpack_require__(66620);
exports._ReplicationRuleAndOperator = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tags: {
            shape: _TagSet_1._TagSet,
            flattened: true,
            locationName: "Tag"
        }
    }
};
//# sourceMappingURL=_ReplicationRuleAndOperator.js.map

/***/ }),

/***/ 54308:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Tag_1 = __webpack_require__(16322);
var _ReplicationRuleAndOperator_1 = __webpack_require__(62995);
exports._ReplicationRuleFilter = {
    type: "structure",
    required: [],
    members: {
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Tag: {
            shape: _Tag_1._Tag
        },
        And: {
            shape: _ReplicationRuleAndOperator_1._ReplicationRuleAndOperator
        }
    }
};
//# sourceMappingURL=_ReplicationRuleFilter.js.map

/***/ }),

/***/ 95586:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ReplicationRule_1 = __webpack_require__(94294);
exports._ReplicationRules = {
    type: "list",
    flattened: true,
    member: {
        shape: _ReplicationRule_1._ReplicationRule
    }
};
//# sourceMappingURL=_ReplicationRules.js.map

/***/ }),

/***/ 64015:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._RequestPaymentConfiguration = {
    type: "structure",
    required: ["Payer"],
    members: {
        Payer: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_RequestPaymentConfiguration.js.map

/***/ }),

/***/ 61828:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._RequestProgress = {
    type: "structure",
    required: [],
    members: {
        Enabled: {
            shape: {
                type: "boolean"
            }
        }
    }
};
//# sourceMappingURL=_RequestProgress.js.map

/***/ }),

/***/ 57094:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _GlacierJobParameters_1 = __webpack_require__(54177);
var _SelectParameters_1 = __webpack_require__(62870);
var _OutputLocation_1 = __webpack_require__(94146);
exports._RestoreRequest = {
    type: "structure",
    required: [],
    members: {
        Days: {
            shape: {
                type: "integer"
            }
        },
        GlacierJobParameters: {
            shape: _GlacierJobParameters_1._GlacierJobParameters
        },
        Type: {
            shape: {
                type: "string"
            }
        },
        Tier: {
            shape: {
                type: "string"
            }
        },
        Description: {
            shape: {
                type: "string"
            }
        },
        SelectParameters: {
            shape: _SelectParameters_1._SelectParameters
        },
        OutputLocation: {
            shape: _OutputLocation_1._OutputLocation
        }
    }
};
//# sourceMappingURL=_RestoreRequest.js.map

/***/ }),

/***/ 59119:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Condition_1 = __webpack_require__(80938);
var _Redirect_1 = __webpack_require__(98533);
exports._RoutingRule = {
    type: "structure",
    required: ["Redirect"],
    members: {
        Condition: {
            shape: _Condition_1._Condition
        },
        Redirect: {
            shape: _Redirect_1._Redirect
        }
    }
};
//# sourceMappingURL=_RoutingRule.js.map

/***/ }),

/***/ 26797:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _RoutingRule_1 = __webpack_require__(59119);
exports._RoutingRules = {
    type: "list",
    member: {
        shape: _RoutingRule_1._RoutingRule,
        locationName: "RoutingRule"
    }
};
//# sourceMappingURL=_RoutingRules.js.map

/***/ }),

/***/ 47448:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _LifecycleExpiration_1 = __webpack_require__(50123);
var _Transition_1 = __webpack_require__(45505);
var _NoncurrentVersionTransition_1 = __webpack_require__(48629);
var _NoncurrentVersionExpiration_1 = __webpack_require__(64086);
var _AbortIncompleteMultipartUpload_1 = __webpack_require__(93639);
exports._Rule = {
    type: "structure",
    required: ["Prefix", "Status"],
    members: {
        Expiration: {
            shape: _LifecycleExpiration_1._LifecycleExpiration
        },
        ID: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Status: {
            shape: {
                type: "string"
            }
        },
        Transition: {
            shape: _Transition_1._Transition
        },
        NoncurrentVersionTransition: {
            shape: _NoncurrentVersionTransition_1._NoncurrentVersionTransition
        },
        NoncurrentVersionExpiration: {
            shape: _NoncurrentVersionExpiration_1._NoncurrentVersionExpiration
        },
        AbortIncompleteMultipartUpload: {
            shape: _AbortIncompleteMultipartUpload_1._AbortIncompleteMultipartUpload
        }
    }
};
//# sourceMappingURL=_Rule.js.map

/***/ }),

/***/ 30169:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Rule_1 = __webpack_require__(47448);
exports._Rules = {
    type: "list",
    flattened: true,
    member: {
        shape: _Rule_1._Rule
    }
};
//# sourceMappingURL=_Rules.js.map

/***/ }),

/***/ 64653:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _FilterRuleList_1 = __webpack_require__(94102);
exports._S3KeyFilter = {
    type: "structure",
    required: [],
    members: {
        FilterRules: {
            shape: _FilterRuleList_1._FilterRuleList,
            locationName: "FilterRule"
        }
    }
};
//# sourceMappingURL=_S3KeyFilter.js.map

/***/ }),

/***/ 28634:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Encryption_1 = __webpack_require__(38672);
var _Grants_1 = __webpack_require__(50781);
var _Tagging_1 = __webpack_require__(71613);
var _UserMetadata_1 = __webpack_require__(65017);
exports._S3Location = {
    type: "structure",
    required: ["BucketName", "Prefix"],
    members: {
        BucketName: {
            shape: {
                type: "string"
            }
        },
        Prefix: {
            shape: {
                type: "string"
            }
        },
        Encryption: {
            shape: _Encryption_1._Encryption
        },
        CannedACL: {
            shape: {
                type: "string"
            }
        },
        AccessControlList: {
            shape: _Grants_1._Grants
        },
        Tagging: {
            shape: _Tagging_1._Tagging
        },
        UserMetadata: {
            shape: _UserMetadata_1._UserMetadata
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_S3Location.js.map

/***/ }),

/***/ 75969:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._SSEKMS = {
    type: "structure",
    required: ["KeyId"],
    members: {
        KeyId: {
            shape: {
                type: "string",
                sensitive: true
            }
        }
    }
};
//# sourceMappingURL=_SSEKMS.js.map

/***/ }),

/***/ 8801:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._SSES3 = {
    type: "structure",
    required: [],
    members: {}
};
//# sourceMappingURL=_SSES3.js.map

/***/ }),

/***/ 22817:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _RecordsEvent_1 = __webpack_require__(98119);
var _StatsEvent_1 = __webpack_require__(21661);
var _ProgressEvent_1 = __webpack_require__(68828);
var _ContinuationEvent_1 = __webpack_require__(22350);
var _EndEvent_1 = __webpack_require__(26147);
exports._SelectObjectContentEventStream = {
    type: "structure",
    required: [],
    members: {
        Records: {
            shape: _RecordsEvent_1._RecordsEvent
        },
        Stats: {
            shape: _StatsEvent_1._StatsEvent
        },
        Progress: {
            shape: _ProgressEvent_1._ProgressEvent
        },
        Cont: {
            shape: _ContinuationEvent_1._ContinuationEvent
        },
        End: {
            shape: _EndEvent_1._EndEvent
        }
    }
};
//# sourceMappingURL=_SelectObjectContentEventStream.js.map

/***/ }),

/***/ 62870:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _InputSerialization_1 = __webpack_require__(71651);
var _OutputSerialization_1 = __webpack_require__(63173);
exports._SelectParameters = {
    type: "structure",
    required: [
        "InputSerialization",
        "ExpressionType",
        "Expression",
        "OutputSerialization"
    ],
    members: {
        InputSerialization: {
            shape: _InputSerialization_1._InputSerialization
        },
        ExpressionType: {
            shape: {
                type: "string"
            }
        },
        Expression: {
            shape: {
                type: "string"
            }
        },
        OutputSerialization: {
            shape: _OutputSerialization_1._OutputSerialization
        }
    }
};
//# sourceMappingURL=_SelectParameters.js.map

/***/ }),

/***/ 58955:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._ServerSideEncryptionByDefault = {
    type: "structure",
    required: ["SSEAlgorithm"],
    members: {
        SSEAlgorithm: {
            shape: {
                type: "string"
            }
        },
        KMSMasterKeyID: {
            shape: {
                type: "string",
                sensitive: true
            }
        }
    }
};
//# sourceMappingURL=_ServerSideEncryptionByDefault.js.map

/***/ }),

/***/ 25535:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ServerSideEncryptionRules_1 = __webpack_require__(58422);
exports._ServerSideEncryptionConfiguration = {
    type: "structure",
    required: ["Rules"],
    members: {
        Rules: {
            shape: _ServerSideEncryptionRules_1._ServerSideEncryptionRules,
            locationName: "Rule"
        }
    }
};
//# sourceMappingURL=_ServerSideEncryptionConfiguration.js.map

/***/ }),

/***/ 61104:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ServerSideEncryptionByDefault_1 = __webpack_require__(58955);
exports._ServerSideEncryptionRule = {
    type: "structure",
    required: [],
    members: {
        ApplyServerSideEncryptionByDefault: {
            shape: _ServerSideEncryptionByDefault_1._ServerSideEncryptionByDefault
        }
    }
};
//# sourceMappingURL=_ServerSideEncryptionRule.js.map

/***/ }),

/***/ 58422:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ServerSideEncryptionRule_1 = __webpack_require__(61104);
exports._ServerSideEncryptionRules = {
    type: "list",
    flattened: true,
    member: {
        shape: _ServerSideEncryptionRule_1._ServerSideEncryptionRule
    }
};
//# sourceMappingURL=_ServerSideEncryptionRules.js.map

/***/ }),

/***/ 10247:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _SseKmsEncryptedObjects_1 = __webpack_require__(44425);
exports._SourceSelectionCriteria = {
    type: "structure",
    required: [],
    members: {
        SseKmsEncryptedObjects: {
            shape: _SseKmsEncryptedObjects_1._SseKmsEncryptedObjects
        }
    }
};
//# sourceMappingURL=_SourceSelectionCriteria.js.map

/***/ }),

/***/ 44425:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._SseKmsEncryptedObjects = {
    type: "structure",
    required: ["Status"],
    members: {
        Status: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_SseKmsEncryptedObjects.js.map

/***/ }),

/***/ 21167:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Stats = {
    type: "structure",
    required: [],
    members: {
        BytesScanned: {
            shape: {
                type: "integer"
            }
        },
        BytesProcessed: {
            shape: {
                type: "integer"
            }
        },
        BytesReturned: {
            shape: {
                type: "integer"
            }
        }
    }
};
//# sourceMappingURL=_Stats.js.map

/***/ }),

/***/ 21661:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Stats_1 = __webpack_require__(21167);
exports._StatsEvent = {
    type: "structure",
    required: [],
    members: {
        Details: {
            shape: _Stats_1._Stats
        }
    }
};
//# sourceMappingURL=_StatsEvent.js.map

/***/ }),

/***/ 46600:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _StorageClassAnalysisDataExport_1 = __webpack_require__(26554);
exports._StorageClassAnalysis = {
    type: "structure",
    required: [],
    members: {
        DataExport: {
            shape: _StorageClassAnalysisDataExport_1._StorageClassAnalysisDataExport
        }
    }
};
//# sourceMappingURL=_StorageClassAnalysis.js.map

/***/ }),

/***/ 26554:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _AnalyticsExportDestination_1 = __webpack_require__(84659);
exports._StorageClassAnalysisDataExport = {
    type: "structure",
    required: ["OutputSchemaVersion", "Destination"],
    members: {
        OutputSchemaVersion: {
            shape: {
                type: "string"
            }
        },
        Destination: {
            shape: _AnalyticsExportDestination_1._AnalyticsExportDestination
        }
    }
};
//# sourceMappingURL=_StorageClassAnalysisDataExport.js.map

/***/ }),

/***/ 16322:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Tag = {
    type: "structure",
    required: ["Key", "Value"],
    members: {
        Key: {
            shape: {
                type: "string",
                min: 1
            }
        },
        Value: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Tag.js.map

/***/ }),

/***/ 66620:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Tag_1 = __webpack_require__(16322);
exports._TagSet = {
    type: "list",
    member: {
        shape: _Tag_1._Tag,
        locationName: "Tag"
    }
};
//# sourceMappingURL=_TagSet.js.map

/***/ }),

/***/ 71613:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TagSet_1 = __webpack_require__(66620);
exports._Tagging = {
    type: "structure",
    required: ["TagSet"],
    members: {
        TagSet: {
            shape: _TagSet_1._TagSet
        }
    }
};
//# sourceMappingURL=_Tagging.js.map

/***/ }),

/***/ 28849:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Grantee_1 = __webpack_require__(64895);
exports._TargetGrant = {
    type: "structure",
    required: [],
    members: {
        Grantee: {
            shape: _Grantee_1._Grantee
        },
        Permission: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_TargetGrant.js.map

/***/ }),

/***/ 34402:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TargetGrant_1 = __webpack_require__(28849);
exports._TargetGrants = {
    type: "list",
    member: {
        shape: _TargetGrant_1._TargetGrant,
        locationName: "Grant"
    }
};
//# sourceMappingURL=_TargetGrants.js.map

/***/ }),

/***/ 13859:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _EventList_1 = __webpack_require__(36031);
var _NotificationConfigurationFilter_1 = __webpack_require__(43446);
exports._TopicConfiguration = {
    type: "structure",
    required: ["TopicArn", "Events"],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        TopicArn: {
            shape: {
                type: "string"
            },
            locationName: "Topic"
        },
        Events: {
            shape: _EventList_1._EventList,
            locationName: "Event"
        },
        Filter: {
            shape: _NotificationConfigurationFilter_1._NotificationConfigurationFilter
        }
    }
};
//# sourceMappingURL=_TopicConfiguration.js.map

/***/ }),

/***/ 91759:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _EventList_1 = __webpack_require__(36031);
exports._TopicConfigurationDeprecated = {
    type: "structure",
    required: [],
    members: {
        Id: {
            shape: {
                type: "string"
            }
        },
        Events: {
            shape: _EventList_1._EventList,
            locationName: "Event"
        },
        Event: {
            shape: {
                type: "string"
            }
        },
        Topic: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_TopicConfigurationDeprecated.js.map

/***/ }),

/***/ 89504:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _TopicConfiguration_1 = __webpack_require__(13859);
exports._TopicConfigurationList = {
    type: "list",
    flattened: true,
    member: {
        shape: _TopicConfiguration_1._TopicConfiguration
    }
};
//# sourceMappingURL=_TopicConfigurationList.js.map

/***/ }),

/***/ 45505:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._Transition = {
    type: "structure",
    required: [],
    members: {
        Date: {
            shape: {
                type: "timestamp",
                timestampFormat: "iso8601"
            }
        },
        Days: {
            shape: {
                type: "integer"
            }
        },
        StorageClass: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_Transition.js.map

/***/ }),

/***/ 69220:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _Transition_1 = __webpack_require__(45505);
exports._TransitionList = {
    type: "list",
    flattened: true,
    member: {
        shape: _Transition_1._Transition
    }
};
//# sourceMappingURL=_TransitionList.js.map

/***/ }),

/***/ 65017:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _MetadataEntry_1 = __webpack_require__(34727);
exports._UserMetadata = {
    type: "list",
    member: {
        shape: _MetadataEntry_1._MetadataEntry,
        locationName: "MetadataEntry"
    }
};
//# sourceMappingURL=_UserMetadata.js.map

/***/ }),

/***/ 53770:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports._VersioningConfiguration = {
    type: "structure",
    required: [],
    members: {
        MFADelete: {
            shape: {
                type: "string"
            },
            locationName: "MfaDelete"
        },
        Status: {
            shape: {
                type: "string"
            }
        }
    }
};
//# sourceMappingURL=_VersioningConfiguration.js.map

/***/ }),

/***/ 86448:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var _ErrorDocument_1 = __webpack_require__(39139);
var _IndexDocument_1 = __webpack_require__(3447);
var _RedirectAllRequestsTo_1 = __webpack_require__(32299);
var _RoutingRules_1 = __webpack_require__(26797);
exports._WebsiteConfiguration = {
    type: "structure",
    required: [],
    members: {
        ErrorDocument: {
            shape: _ErrorDocument_1._ErrorDocument
        },
        IndexDocument: {
            shape: _IndexDocument_1._IndexDocument
        },
        RedirectAllRequestsTo: {
            shape: _RedirectAllRequestsTo_1._RedirectAllRequestsTo
        },
        RoutingRules: {
            shape: _RoutingRules_1._RoutingRules
        }
    }
};
//# sourceMappingURL=_WebsiteConfiguration.js.map

/***/ }),

/***/ 17808:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function resolveConfiguration(providedConfiguration, configurationDefinition, middlewareStack) {
    var e_1, _a;
    var out = {};
    var applicators = [];
    try {
        // Iterate over the definitions own keys, using getOwnPropertyNames to
        // guarantee insertion order is preserved.
        // @see https://www.ecma-international.org/ecma-262/6.0/#sec-ordinary-object-internal-methods-and-internal-slots-ownpropertykeys
        for (var _b = tslib_1.__values(Object.getOwnPropertyNames(configurationDefinition)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var property = _c.value;
            var _d = configurationDefinition[property], required = _d.required, defaultValue = _d.defaultValue, defaultProvider = _d.defaultProvider, normalize = _d.normalize, apply = _d.apply;
            var input = providedConfiguration[property];
            if (input === undefined) {
                if (defaultValue !== undefined) {
                    input = defaultValue;
                }
                else if (defaultProvider) {
                    input = defaultProvider(out);
                }
                else if (required) {
                    throw new Error("No input provided for required configuration parameter: " + property);
                }
            }
            else if (normalize) {
                input = normalize(input, out);
            }
            out[property] = input;
            if (apply) {
                applicators.push(apply);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    applicators.forEach(function (func) { return func(out, middlewareStack); });
    return out;
}
exports.resolveConfiguration = resolveConfiguration;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 64818:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function coreHandler(httpHandler, responseParser) {
    return function (_a) {
        var model = _a.model;
        return function (_a) {
            var request = _a.request, abortSignal = _a.input.$abortSignal;
            return httpHandler
                .handle(request, { abortSignal: abortSignal })
                .then(function (response) { return responseParser.parse(model, response); });
        };
    };
}
exports.coreHandler = coreHandler;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 47579:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var property_provider_1 = __webpack_require__(36772);
var protocol_timestamp_1 = __webpack_require__(27949);
exports.ENV_KEY = "AWS_ACCESS_KEY_ID";
exports.ENV_SECRET = "AWS_SECRET_ACCESS_KEY";
exports.ENV_SESSION = "AWS_SESSION_TOKEN";
exports.ENV_EXPIRATION = "AWS_CREDENTIAL_EXPIRATION";
/**
 * Source AWS credentials from known environment variables. If either the
 * `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` environment variable is not
 * set in this process, the provider will return a rejected promise.
 */
function fromEnv() {
    return function () {
        var accessKeyId = process.env[exports.ENV_KEY];
        var secretAccessKey = process.env[exports.ENV_SECRET];
        var expiry = process.env[exports.ENV_EXPIRATION];
        if (accessKeyId && secretAccessKey) {
            return Promise.resolve({
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
                sessionToken: process.env[exports.ENV_SESSION],
                expiration: expiry ? protocol_timestamp_1.epoch(expiry) : undefined
            });
        }
        return Promise.reject(new property_provider_1.ProviderError("Unable to find environment variable credentials."));
    };
}
exports.fromEnv = fromEnv;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 36864:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var RemoteProviderInit_1 = __webpack_require__(21568);
var httpGet_1 = __webpack_require__(54537);
var ImdsCredentials_1 = __webpack_require__(14339);
var retry_1 = __webpack_require__(38267);
var property_provider_1 = __webpack_require__(36772);
var url_1 = __webpack_require__(78835);
exports.ENV_CMDS_FULL_URI = "AWS_CONTAINER_CREDENTIALS_FULL_URI";
exports.ENV_CMDS_RELATIVE_URI = "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI";
exports.ENV_CMDS_AUTH_TOKEN = "AWS_CONTAINER_AUTHORIZATION_TOKEN";
/**
 * Creates a credential provider that will source credentials from the ECS
 * Container Metadata Service
 */
function fromContainerMetadata(init) {
    var _this = this;
    if (init === void 0) { init = {}; }
    var _a = RemoteProviderInit_1.providerConfigFromInit(init), timeout = _a.timeout, maxRetries = _a.maxRetries;
    return function () {
        return getCmdsUri().then(function (url) {
            return retry_1.retry(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                var credsResponse, _a, _b;
                return tslib_1.__generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _b = (_a = JSON).parse;
                            return [4 /*yield*/, requestFromEcsImds(timeout, url)];
                        case 1:
                            credsResponse = _b.apply(_a, [_c.sent()]);
                            if (!ImdsCredentials_1.isImdsCredentials(credsResponse)) {
                                throw new property_provider_1.ProviderError("Invalid response received from instance metadata service.");
                            }
                            return [2 /*return*/, ImdsCredentials_1.fromImdsCredentials(credsResponse)];
                    }
                });
            }); }, maxRetries);
        });
    };
}
exports.fromContainerMetadata = fromContainerMetadata;
function requestFromEcsImds(timeout, options) {
    if (process.env[exports.ENV_CMDS_AUTH_TOKEN]) {
        var _a = options.headers, headers = _a === void 0 ? {} : _a;
        headers.Authorization = process.env[exports.ENV_CMDS_AUTH_TOKEN];
        options.headers = headers;
    }
    return httpGet_1.httpGet(tslib_1.__assign({}, options, { timeout: timeout })).then(function (buffer) { return buffer.toString(); });
}
var CMDS_IP = "169.254.170.2";
var GREENGRASS_HOSTS = {
    localhost: true,
    "127.0.0.1": true
};
var GREENGRASS_PROTOCOLS = {
    "http:": true,
    "https:": true
};
function getCmdsUri() {
    if (process.env[exports.ENV_CMDS_RELATIVE_URI]) {
        return Promise.resolve({
            hostname: CMDS_IP,
            path: process.env[exports.ENV_CMDS_RELATIVE_URI]
        });
    }
    if (process.env[exports.ENV_CMDS_FULL_URI]) {
        var parsed = url_1.parse(process.env[exports.ENV_CMDS_FULL_URI]);
        if (!parsed.hostname || !(parsed.hostname in GREENGRASS_HOSTS)) {
            return Promise.reject(new property_provider_1.ProviderError(parsed.hostname + " is not a valid container metadata service hostname", false));
        }
        if (!parsed.protocol || !(parsed.protocol in GREENGRASS_PROTOCOLS)) {
            return Promise.reject(new property_provider_1.ProviderError(parsed.protocol + " is not a valid container metadata service protocol", false));
        }
        return Promise.resolve(tslib_1.__assign({}, parsed, { port: parsed.port ? parseInt(parsed.port, 10) : undefined }));
    }
    return Promise.reject(new property_provider_1.ProviderError("The container metadata credential provider cannot be used unless" +
        (" the " + exports.ENV_CMDS_RELATIVE_URI + " or " + exports.ENV_CMDS_FULL_URI + " environment") +
        " variable is set", false));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbUNvbnRhaW5lck1ldGFkYXRhLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsiZnJvbUNvbnRhaW5lck1ldGFkYXRhLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDBFQUc2QztBQUM3QyxvREFBbUQ7QUFDbkQsb0VBRzBDO0FBQzFDLGdEQUErQztBQUMvQyxnRUFBMkQ7QUFDM0QsMkJBQTRCO0FBR2YsUUFBQSxpQkFBaUIsR0FBRyxvQ0FBb0MsQ0FBQztBQUN6RCxRQUFBLHFCQUFxQixHQUFHLHdDQUF3QyxDQUFDO0FBQ2pFLFFBQUEsbUJBQW1CLEdBQUcsbUNBQW1DLENBQUM7QUFFdkU7OztHQUdHO0FBQ0gsU0FBZ0IscUJBQXFCLENBQ25DLElBQTZCO0lBRC9CLGlCQW9CQztJQW5CQyxxQkFBQSxFQUFBLFNBQTZCO0lBRXZCLElBQUEsc0RBQXNELEVBQXBELG9CQUFPLEVBQUUsMEJBQTJDLENBQUM7SUFDN0QsT0FBTztRQUNMLE9BQU8sVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUEsR0FBRztZQUMxQixPQUFBLGFBQUssQ0FBQzs7Ozs7NEJBQ2tCLEtBQUEsQ0FBQSxLQUFBLElBQUksQ0FBQSxDQUFDLEtBQUssQ0FBQTs0QkFDOUIscUJBQU0sa0JBQWtCLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFBOzs0QkFEbEMsYUFBYSxHQUFHLGNBQ3BCLFNBQXNDLEVBQ3ZDOzRCQUNELElBQUksQ0FBQyxtQ0FBaUIsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQ0FDckMsTUFBTSxJQUFJLGlDQUFhLENBQ3JCLDJEQUEyRCxDQUM1RCxDQUFDOzZCQUNIOzRCQUVELHNCQUFPLHFDQUFtQixDQUFDLGFBQWEsQ0FBQyxFQUFDOzs7aUJBQzNDLEVBQUUsVUFBVSxDQUFDO1FBWGQsQ0FXYyxDQUNmLENBQUM7SUFDSixDQUFDLENBQUM7QUFDSixDQUFDO0FBcEJELHNEQW9CQztBQUVELFNBQVMsa0JBQWtCLENBQ3pCLE9BQWUsRUFDZixPQUF1QjtJQUV2QixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQW1CLENBQUMsRUFBRTtRQUM1QixJQUFBLG9CQUFZLEVBQVosaUNBQVksQ0FBYTtRQUNqQyxPQUFPLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsMkJBQW1CLENBQUMsQ0FBQztRQUN6RCxPQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztLQUMzQjtJQUVELE9BQU8saUJBQU8sc0JBQ1QsT0FBTyxJQUNWLE9BQU8sU0FBQSxJQUNQLENBQUMsSUFBSSxDQUFDLFVBQUEsTUFBTSxJQUFJLE9BQUEsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFqQixDQUFpQixDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVELElBQU0sT0FBTyxHQUFHLGVBQWUsQ0FBQztBQUNoQyxJQUFNLGdCQUFnQixHQUFHO0lBQ3ZCLFNBQVMsRUFBRSxJQUFJO0lBQ2YsV0FBVyxFQUFFLElBQUk7Q0FDbEIsQ0FBQztBQUNGLElBQU0sb0JBQW9CLEdBQUc7SUFDM0IsT0FBTyxFQUFFLElBQUk7SUFDYixRQUFRLEVBQUUsSUFBSTtDQUNmLENBQUM7QUFFRixTQUFTLFVBQVU7SUFDakIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUFxQixDQUFDLEVBQUU7UUFDdEMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ3JCLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLElBQUksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUFxQixDQUFDO1NBQ3pDLENBQUMsQ0FBQztLQUNKO0lBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUFpQixDQUFDLEVBQUU7UUFDbEMsSUFBTSxNQUFNLEdBQUcsV0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMseUJBQWlCLENBQUUsQ0FBQyxDQUFDO1FBQ3RELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLGdCQUFnQixDQUFDLEVBQUU7WUFDOUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUNuQixJQUFJLGlDQUFhLENBQ1osTUFBTSxDQUFDLFFBQVEsd0RBQXFELEVBQ3ZFLEtBQUssQ0FDTixDQUNGLENBQUM7U0FDSDtRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxJQUFJLG9CQUFvQixDQUFDLEVBQUU7WUFDbEUsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUNuQixJQUFJLGlDQUFhLENBQ1osTUFBTSxDQUFDLFFBQVEsd0RBQXFELEVBQ3ZFLEtBQUssQ0FDTixDQUNGLENBQUM7U0FDSDtRQUVELE9BQU8sT0FBTyxDQUFDLE9BQU8sc0JBQ2pCLE1BQU0sSUFDVCxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFDekQsQ0FBQztLQUNKO0lBRUQsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUNuQixJQUFJLGlDQUFhLENBQ2Ysa0VBQWtFO1NBQ2hFLFVBQVEsNkJBQXFCLFlBQU8seUJBQWlCLGlCQUFjLENBQUE7UUFDbkUsa0JBQWtCLEVBQ3BCLEtBQUssQ0FDTixDQUNGLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3JlZGVudGlhbFByb3ZpZGVyIH0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5pbXBvcnQge1xuICBSZW1vdGVQcm92aWRlckluaXQsXG4gIHByb3ZpZGVyQ29uZmlnRnJvbUluaXRcbn0gZnJvbSBcIi4vcmVtb3RlUHJvdmlkZXIvUmVtb3RlUHJvdmlkZXJJbml0XCI7XG5pbXBvcnQgeyBodHRwR2V0IH0gZnJvbSBcIi4vcmVtb3RlUHJvdmlkZXIvaHR0cEdldFwiO1xuaW1wb3J0IHtcbiAgZnJvbUltZHNDcmVkZW50aWFscyxcbiAgaXNJbWRzQ3JlZGVudGlhbHNcbn0gZnJvbSBcIi4vcmVtb3RlUHJvdmlkZXIvSW1kc0NyZWRlbnRpYWxzXCI7XG5pbXBvcnQgeyByZXRyeSB9IGZyb20gXCIuL3JlbW90ZVByb3ZpZGVyL3JldHJ5XCI7XG5pbXBvcnQgeyBQcm92aWRlckVycm9yIH0gZnJvbSBcIkBhd3Mtc2RrL3Byb3BlcnR5LXByb3ZpZGVyXCI7XG5pbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJ1cmxcIjtcbmltcG9ydCB7IFJlcXVlc3RPcHRpb25zIH0gZnJvbSBcImh0dHBcIjtcblxuZXhwb3J0IGNvbnN0IEVOVl9DTURTX0ZVTExfVVJJID0gXCJBV1NfQ09OVEFJTkVSX0NSRURFTlRJQUxTX0ZVTExfVVJJXCI7XG5leHBvcnQgY29uc3QgRU5WX0NNRFNfUkVMQVRJVkVfVVJJID0gXCJBV1NfQ09OVEFJTkVSX0NSRURFTlRJQUxTX1JFTEFUSVZFX1VSSVwiO1xuZXhwb3J0IGNvbnN0IEVOVl9DTURTX0FVVEhfVE9LRU4gPSBcIkFXU19DT05UQUlORVJfQVVUSE9SSVpBVElPTl9UT0tFTlwiO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBjcmVkZW50aWFsIHByb3ZpZGVyIHRoYXQgd2lsbCBzb3VyY2UgY3JlZGVudGlhbHMgZnJvbSB0aGUgRUNTXG4gKiBDb250YWluZXIgTWV0YWRhdGEgU2VydmljZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbUNvbnRhaW5lck1ldGFkYXRhKFxuICBpbml0OiBSZW1vdGVQcm92aWRlckluaXQgPSB7fVxuKTogQ3JlZGVudGlhbFByb3ZpZGVyIHtcbiAgY29uc3QgeyB0aW1lb3V0LCBtYXhSZXRyaWVzIH0gPSBwcm92aWRlckNvbmZpZ0Zyb21Jbml0KGluaXQpO1xuICByZXR1cm4gKCkgPT4ge1xuICAgIHJldHVybiBnZXRDbWRzVXJpKCkudGhlbih1cmwgPT5cbiAgICAgIHJldHJ5KGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3QgY3JlZHNSZXNwb25zZSA9IEpTT04ucGFyc2UoXG4gICAgICAgICAgYXdhaXQgcmVxdWVzdEZyb21FY3NJbWRzKHRpbWVvdXQsIHVybClcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKCFpc0ltZHNDcmVkZW50aWFscyhjcmVkc1Jlc3BvbnNlKSkge1xuICAgICAgICAgIHRocm93IG5ldyBQcm92aWRlckVycm9yKFxuICAgICAgICAgICAgXCJJbnZhbGlkIHJlc3BvbnNlIHJlY2VpdmVkIGZyb20gaW5zdGFuY2UgbWV0YWRhdGEgc2VydmljZS5cIlxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZnJvbUltZHNDcmVkZW50aWFscyhjcmVkc1Jlc3BvbnNlKTtcbiAgICAgIH0sIG1heFJldHJpZXMpXG4gICAgKTtcbiAgfTtcbn1cblxuZnVuY3Rpb24gcmVxdWVzdEZyb21FY3NJbWRzKFxuICB0aW1lb3V0OiBudW1iZXIsXG4gIG9wdGlvbnM6IFJlcXVlc3RPcHRpb25zXG4pOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAocHJvY2Vzcy5lbnZbRU5WX0NNRFNfQVVUSF9UT0tFTl0pIHtcbiAgICBjb25zdCB7IGhlYWRlcnMgPSB7fSB9ID0gb3B0aW9ucztcbiAgICBoZWFkZXJzLkF1dGhvcml6YXRpb24gPSBwcm9jZXNzLmVudltFTlZfQ01EU19BVVRIX1RPS0VOXTtcbiAgICBvcHRpb25zLmhlYWRlcnMgPSBoZWFkZXJzO1xuICB9XG5cbiAgcmV0dXJuIGh0dHBHZXQoe1xuICAgIC4uLm9wdGlvbnMsXG4gICAgdGltZW91dFxuICB9KS50aGVuKGJ1ZmZlciA9PiBidWZmZXIudG9TdHJpbmcoKSk7XG59XG5cbmNvbnN0IENNRFNfSVAgPSBcIjE2OS4yNTQuMTcwLjJcIjtcbmNvbnN0IEdSRUVOR1JBU1NfSE9TVFMgPSB7XG4gIGxvY2FsaG9zdDogdHJ1ZSxcbiAgXCIxMjcuMC4wLjFcIjogdHJ1ZVxufTtcbmNvbnN0IEdSRUVOR1JBU1NfUFJPVE9DT0xTID0ge1xuICBcImh0dHA6XCI6IHRydWUsXG4gIFwiaHR0cHM6XCI6IHRydWVcbn07XG5cbmZ1bmN0aW9uIGdldENtZHNVcmkoKTogUHJvbWlzZTxSZXF1ZXN0T3B0aW9ucz4ge1xuICBpZiAocHJvY2Vzcy5lbnZbRU5WX0NNRFNfUkVMQVRJVkVfVVJJXSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgaG9zdG5hbWU6IENNRFNfSVAsXG4gICAgICBwYXRoOiBwcm9jZXNzLmVudltFTlZfQ01EU19SRUxBVElWRV9VUkldXG4gICAgfSk7XG4gIH1cblxuICBpZiAocHJvY2Vzcy5lbnZbRU5WX0NNRFNfRlVMTF9VUkldKSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2UocHJvY2Vzcy5lbnZbRU5WX0NNRFNfRlVMTF9VUkldISk7XG4gICAgaWYgKCFwYXJzZWQuaG9zdG5hbWUgfHwgIShwYXJzZWQuaG9zdG5hbWUgaW4gR1JFRU5HUkFTU19IT1NUUykpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbmV3IFByb3ZpZGVyRXJyb3IoXG4gICAgICAgICAgYCR7cGFyc2VkLmhvc3RuYW1lfSBpcyBub3QgYSB2YWxpZCBjb250YWluZXIgbWV0YWRhdGEgc2VydmljZSBob3N0bmFtZWAsXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAoIXBhcnNlZC5wcm90b2NvbCB8fCAhKHBhcnNlZC5wcm90b2NvbCBpbiBHUkVFTkdSQVNTX1BST1RPQ09MUykpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbmV3IFByb3ZpZGVyRXJyb3IoXG4gICAgICAgICAgYCR7cGFyc2VkLnByb3RvY29sfSBpcyBub3QgYSB2YWxpZCBjb250YWluZXIgbWV0YWRhdGEgc2VydmljZSBwcm90b2NvbGAsXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgIC4uLnBhcnNlZCxcbiAgICAgIHBvcnQ6IHBhcnNlZC5wb3J0ID8gcGFyc2VJbnQocGFyc2VkLnBvcnQsIDEwKSA6IHVuZGVmaW5lZFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgIG5ldyBQcm92aWRlckVycm9yKFxuICAgICAgXCJUaGUgY29udGFpbmVyIG1ldGFkYXRhIGNyZWRlbnRpYWwgcHJvdmlkZXIgY2Fubm90IGJlIHVzZWQgdW5sZXNzXCIgK1xuICAgICAgICBgIHRoZSAke0VOVl9DTURTX1JFTEFUSVZFX1VSSX0gb3IgJHtFTlZfQ01EU19GVUxMX1VSSX0gZW52aXJvbm1lbnRgICtcbiAgICAgICAgXCIgdmFyaWFibGUgaXMgc2V0XCIsXG4gICAgICBmYWxzZVxuICAgIClcbiAgKTtcbn1cbiJdfQ==

/***/ }),

/***/ 75222:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var RemoteProviderInit_1 = __webpack_require__(21568);
var httpGet_1 = __webpack_require__(54537);
var ImdsCredentials_1 = __webpack_require__(14339);
var retry_1 = __webpack_require__(38267);
var property_provider_1 = __webpack_require__(36772);
/**
 * Creates a credential provider that will source credentials from the EC2
 * Instance Metadata Service
 */
function fromInstanceMetadata(init) {
    var _this = this;
    if (init === void 0) { init = {}; }
    var _a = RemoteProviderInit_1.providerConfigFromInit(init), timeout = _a.timeout, maxRetries = _a.maxRetries;
    return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var profile;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, retry_1.retry(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, requestFromEc2Imds(timeout)];
                            case 1: return [2 /*return*/, _a.sent()];
                        }
                    }); }); }, maxRetries)];
                case 1:
                    profile = (_a.sent()).trim();
                    return [2 /*return*/, retry_1.retry(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                            var credsResponse, _a, _b;
                            return tslib_1.__generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _b = (_a = JSON).parse;
                                        return [4 /*yield*/, requestFromEc2Imds(timeout, profile)];
                                    case 1:
                                        credsResponse = _b.apply(_a, [_c.sent()]);
                                        if (!ImdsCredentials_1.isImdsCredentials(credsResponse)) {
                                            throw new property_provider_1.ProviderError("Invalid response received from instance metadata service.");
                                        }
                                        return [2 /*return*/, ImdsCredentials_1.fromImdsCredentials(credsResponse)];
                                }
                            });
                        }); }, maxRetries)];
            }
        });
    }); };
}
exports.fromInstanceMetadata = fromInstanceMetadata;
var IMDS_IP = "169.254.169.254";
var IMDS_PATH = "latest/meta-data/iam/security-credentials";
function requestFromEc2Imds(timeout, path) {
    return httpGet_1.httpGet({
        host: IMDS_IP,
        path: "/" + IMDS_PATH + "/" + (path ? path : ""),
        timeout: timeout
    }).then(function (buffer) { return buffer.toString(); });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbUluc3RhbmNlTWV0YWRhdGEuanMiLCJzb3VyY2VSb290IjoiLi9zcmMvIiwic291cmNlcyI6WyJmcm9tSW5zdGFuY2VNZXRhZGF0YS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSwwRUFHNkM7QUFDN0Msb0RBQW1EO0FBQ25ELG9FQUcwQztBQUMxQyxnREFBK0M7QUFDL0MsZ0VBQTJEO0FBRTNEOzs7R0FHRztBQUNILFNBQWdCLG9CQUFvQixDQUNsQyxJQUE2QjtJQUQvQixpQkF5QkM7SUF4QkMscUJBQUEsRUFBQSxTQUE2QjtJQUV2QixJQUFBLHNEQUFzRCxFQUFwRCxvQkFBTyxFQUFFLDBCQUEyQyxDQUFDO0lBQzdELE9BQU87Ozs7O3dCQUVILHFCQUFNLGFBQUssQ0FDVDs7b0NBQVkscUJBQU0sa0JBQWtCLENBQUMsT0FBTyxDQUFDLEVBQUE7b0NBQWpDLHNCQUFBLFNBQWlDLEVBQUE7OzZCQUFBLEVBQzdDLFVBQVUsQ0FDWCxFQUFBOztvQkFKRyxPQUFPLEdBQUcsQ0FDZCxTQUdDLENBQ0YsQ0FBQyxJQUFJLEVBQUU7b0JBRVIsc0JBQU8sYUFBSyxDQUFDOzs7Ozt3Q0FDVyxLQUFBLENBQUEsS0FBQSxJQUFJLENBQUEsQ0FBQyxLQUFLLENBQUE7d0NBQzlCLHFCQUFNLGtCQUFrQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBQTs7d0NBRHRDLGFBQWEsR0FBRyxjQUNwQixTQUEwQyxFQUMzQzt3Q0FDRCxJQUFJLENBQUMsbUNBQWlCLENBQUMsYUFBYSxDQUFDLEVBQUU7NENBQ3JDLE1BQU0sSUFBSSxpQ0FBYSxDQUNyQiwyREFBMkQsQ0FDNUQsQ0FBQzt5Q0FDSDt3Q0FFRCxzQkFBTyxxQ0FBbUIsQ0FBQyxhQUFhLENBQUMsRUFBQzs7OzZCQUMzQyxFQUFFLFVBQVUsQ0FBQyxFQUFDOzs7U0FDaEIsQ0FBQztBQUNKLENBQUM7QUF6QkQsb0RBeUJDO0FBRUQsSUFBTSxPQUFPLEdBQUcsaUJBQWlCLENBQUM7QUFDbEMsSUFBTSxTQUFTLEdBQUcsMkNBQTJDLENBQUM7QUFFOUQsU0FBUyxrQkFBa0IsQ0FBQyxPQUFlLEVBQUUsSUFBYTtJQUN4RCxPQUFPLGlCQUFPLENBQUM7UUFDYixJQUFJLEVBQUUsT0FBTztRQUNiLElBQUksRUFBRSxNQUFJLFNBQVMsVUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFFO1FBQ3pDLE9BQU8sU0FBQTtLQUNSLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxNQUFNLElBQUksT0FBQSxNQUFNLENBQUMsUUFBUSxFQUFFLEVBQWpCLENBQWlCLENBQUMsQ0FBQztBQUN2QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3JlZGVudGlhbFByb3ZpZGVyIH0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5pbXBvcnQge1xuICBSZW1vdGVQcm92aWRlckluaXQsXG4gIHByb3ZpZGVyQ29uZmlnRnJvbUluaXRcbn0gZnJvbSBcIi4vcmVtb3RlUHJvdmlkZXIvUmVtb3RlUHJvdmlkZXJJbml0XCI7XG5pbXBvcnQgeyBodHRwR2V0IH0gZnJvbSBcIi4vcmVtb3RlUHJvdmlkZXIvaHR0cEdldFwiO1xuaW1wb3J0IHtcbiAgZnJvbUltZHNDcmVkZW50aWFscyxcbiAgaXNJbWRzQ3JlZGVudGlhbHNcbn0gZnJvbSBcIi4vcmVtb3RlUHJvdmlkZXIvSW1kc0NyZWRlbnRpYWxzXCI7XG5pbXBvcnQgeyByZXRyeSB9IGZyb20gXCIuL3JlbW90ZVByb3ZpZGVyL3JldHJ5XCI7XG5pbXBvcnQgeyBQcm92aWRlckVycm9yIH0gZnJvbSBcIkBhd3Mtc2RrL3Byb3BlcnR5LXByb3ZpZGVyXCI7XG5cbi8qKlxuICogQ3JlYXRlcyBhIGNyZWRlbnRpYWwgcHJvdmlkZXIgdGhhdCB3aWxsIHNvdXJjZSBjcmVkZW50aWFscyBmcm9tIHRoZSBFQzJcbiAqIEluc3RhbmNlIE1ldGFkYXRhIFNlcnZpY2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21JbnN0YW5jZU1ldGFkYXRhKFxuICBpbml0OiBSZW1vdGVQcm92aWRlckluaXQgPSB7fVxuKTogQ3JlZGVudGlhbFByb3ZpZGVyIHtcbiAgY29uc3QgeyB0aW1lb3V0LCBtYXhSZXRyaWVzIH0gPSBwcm92aWRlckNvbmZpZ0Zyb21Jbml0KGluaXQpO1xuICByZXR1cm4gYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHByb2ZpbGUgPSAoXG4gICAgICBhd2FpdCByZXRyeTxzdHJpbmc+KFxuICAgICAgICBhc3luYyAoKSA9PiBhd2FpdCByZXF1ZXN0RnJvbUVjMkltZHModGltZW91dCksXG4gICAgICAgIG1heFJldHJpZXNcbiAgICAgIClcbiAgICApLnRyaW0oKTtcblxuICAgIHJldHVybiByZXRyeShhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBjcmVkc1Jlc3BvbnNlID0gSlNPTi5wYXJzZShcbiAgICAgICAgYXdhaXQgcmVxdWVzdEZyb21FYzJJbWRzKHRpbWVvdXQsIHByb2ZpbGUpXG4gICAgICApO1xuICAgICAgaWYgKCFpc0ltZHNDcmVkZW50aWFscyhjcmVkc1Jlc3BvbnNlKSkge1xuICAgICAgICB0aHJvdyBuZXcgUHJvdmlkZXJFcnJvcihcbiAgICAgICAgICBcIkludmFsaWQgcmVzcG9uc2UgcmVjZWl2ZWQgZnJvbSBpbnN0YW5jZSBtZXRhZGF0YSBzZXJ2aWNlLlwiXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmcm9tSW1kc0NyZWRlbnRpYWxzKGNyZWRzUmVzcG9uc2UpO1xuICAgIH0sIG1heFJldHJpZXMpO1xuICB9O1xufVxuXG5jb25zdCBJTURTX0lQID0gXCIxNjkuMjU0LjE2OS4yNTRcIjtcbmNvbnN0IElNRFNfUEFUSCA9IFwibGF0ZXN0L21ldGEtZGF0YS9pYW0vc2VjdXJpdHktY3JlZGVudGlhbHNcIjtcblxuZnVuY3Rpb24gcmVxdWVzdEZyb21FYzJJbWRzKHRpbWVvdXQ6IG51bWJlciwgcGF0aD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBodHRwR2V0KHtcbiAgICBob3N0OiBJTURTX0lQLFxuICAgIHBhdGg6IGAvJHtJTURTX1BBVEh9LyR7cGF0aCA/IHBhdGggOiBcIlwifWAsXG4gICAgdGltZW91dFxuICB9KS50aGVuKGJ1ZmZlciA9PiBidWZmZXIudG9TdHJpbmcoKSk7XG59XG4iXX0=

/***/ }),

/***/ 3496:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(36864), exports);
tslib_1.__exportStar(__webpack_require__(75222), exports);
tslib_1.__exportStar(__webpack_require__(21568), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiLi9zcmMvIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrRUFBd0M7QUFDeEMsaUVBQXVDO0FBQ3ZDLDhFQUFvRCIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gXCIuL2Zyb21Db250YWluZXJNZXRhZGF0YVwiO1xuZXhwb3J0ICogZnJvbSBcIi4vZnJvbUluc3RhbmNlTWV0YWRhdGFcIjtcbmV4cG9ydCAqIGZyb20gXCIuL3JlbW90ZVByb3ZpZGVyL1JlbW90ZVByb3ZpZGVySW5pdFwiO1xuIl19

/***/ }),

/***/ 14339:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function isImdsCredentials(arg) {
    return (Boolean(arg) &&
        typeof arg === "object" &&
        typeof arg.AccessKeyId === "string" &&
        typeof arg.SecretAccessKey === "string" &&
        typeof arg.Token === "string" &&
        typeof arg.Expiration === "string");
}
exports.isImdsCredentials = isImdsCredentials;
function fromImdsCredentials(creds) {
    return {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.Token,
        expiration: Math.floor(new Date(creds.Expiration).valueOf() / 1000)
    };
}
exports.fromImdsCredentials = fromImdsCredentials;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW1kc0NyZWRlbnRpYWxzLmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsicmVtb3RlUHJvdmlkZXIvSW1kc0NyZWRlbnRpYWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBU0EsU0FBZ0IsaUJBQWlCLENBQUMsR0FBUTtJQUN4QyxPQUFPLENBQ0wsT0FBTyxDQUFDLEdBQUcsQ0FBQztRQUNaLE9BQU8sR0FBRyxLQUFLLFFBQVE7UUFDdkIsT0FBTyxHQUFHLENBQUMsV0FBVyxLQUFLLFFBQVE7UUFDbkMsT0FBTyxHQUFHLENBQUMsZUFBZSxLQUFLLFFBQVE7UUFDdkMsT0FBTyxHQUFHLENBQUMsS0FBSyxLQUFLLFFBQVE7UUFDN0IsT0FBTyxHQUFHLENBQUMsVUFBVSxLQUFLLFFBQVEsQ0FDbkMsQ0FBQztBQUNKLENBQUM7QUFURCw4Q0FTQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLEtBQXNCO0lBQ3hELE9BQU87UUFDTCxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQVc7UUFDOUIsZUFBZSxFQUFFLEtBQUssQ0FBQyxlQUFlO1FBQ3RDLFlBQVksRUFBRSxLQUFLLENBQUMsS0FBSztRQUN6QixVQUFVLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDO0tBQ3BFLENBQUM7QUFDSixDQUFDO0FBUEQsa0RBT0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDcmVkZW50aWFscyB9IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEltZHNDcmVkZW50aWFscyB7XG4gIEFjY2Vzc0tleUlkOiBzdHJpbmc7XG4gIFNlY3JldEFjY2Vzc0tleTogc3RyaW5nO1xuICBUb2tlbjogc3RyaW5nO1xuICBFeHBpcmF0aW9uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ltZHNDcmVkZW50aWFscyhhcmc6IGFueSk6IGFyZyBpcyBJbWRzQ3JlZGVudGlhbHMge1xuICByZXR1cm4gKFxuICAgIEJvb2xlYW4oYXJnKSAmJlxuICAgIHR5cGVvZiBhcmcgPT09IFwib2JqZWN0XCIgJiZcbiAgICB0eXBlb2YgYXJnLkFjY2Vzc0tleUlkID09PSBcInN0cmluZ1wiICYmXG4gICAgdHlwZW9mIGFyZy5TZWNyZXRBY2Nlc3NLZXkgPT09IFwic3RyaW5nXCIgJiZcbiAgICB0eXBlb2YgYXJnLlRva2VuID09PSBcInN0cmluZ1wiICYmXG4gICAgdHlwZW9mIGFyZy5FeHBpcmF0aW9uID09PSBcInN0cmluZ1wiXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmcm9tSW1kc0NyZWRlbnRpYWxzKGNyZWRzOiBJbWRzQ3JlZGVudGlhbHMpOiBDcmVkZW50aWFscyB7XG4gIHJldHVybiB7XG4gICAgYWNjZXNzS2V5SWQ6IGNyZWRzLkFjY2Vzc0tleUlkLFxuICAgIHNlY3JldEFjY2Vzc0tleTogY3JlZHMuU2VjcmV0QWNjZXNzS2V5LFxuICAgIHNlc3Npb25Ub2tlbjogY3JlZHMuVG9rZW4sXG4gICAgZXhwaXJhdGlvbjogTWF0aC5mbG9vcihuZXcgRGF0ZShjcmVkcy5FeHBpcmF0aW9uKS52YWx1ZU9mKCkgLyAxMDAwKVxuICB9O1xufVxuIl19

/***/ }),

/***/ 21568:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULT_TIMEOUT = 1000;
exports.DEFAULT_MAX_RETRIES = 0;
function providerConfigFromInit(init) {
    var _a = init.timeout, timeout = _a === void 0 ? exports.DEFAULT_TIMEOUT : _a, _b = init.maxRetries, maxRetries = _b === void 0 ? exports.DEFAULT_MAX_RETRIES : _b;
    return { maxRetries: maxRetries, timeout: timeout };
}
exports.providerConfigFromInit = providerConfigFromInit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVtb3RlUHJvdmlkZXJJbml0LmpzIiwic291cmNlUm9vdCI6Ii4vc3JjLyIsInNvdXJjZXMiOlsicmVtb3RlUHJvdmlkZXIvUmVtb3RlUHJvdmlkZXJJbml0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQWEsUUFBQSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLFFBQUEsbUJBQW1CLEdBQUcsQ0FBQyxDQUFDO0FBZ0JyQyxTQUFnQixzQkFBc0IsQ0FDcEMsSUFBd0I7SUFFaEIsSUFBQSxpQkFBeUIsRUFBekIsc0RBQXlCLEVBQUUsb0JBQWdDLEVBQWhDLDZEQUFnQyxDQUFVO0lBRTdFLE9BQU8sRUFBRSxVQUFVLFlBQUEsRUFBRSxPQUFPLFNBQUEsRUFBRSxDQUFDO0FBQ2pDLENBQUM7QUFORCx3REFNQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBERUZBVUxUX1RJTUVPVVQgPSAxMDAwO1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfTUFYX1JFVFJJRVMgPSAwO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlbW90ZVByb3ZpZGVyQ29uZmlnIHtcbiAgLyoqXG4gICAqIFRoZSBjb25uZWN0aW9uIHRpbWVvdXQgKGluIG1pbGxpc2Vjb25kcylcbiAgICovXG4gIHRpbWVvdXQ6IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIHRpbWVzIHRoZSBIVFRQIGNvbm5lY3Rpb24gc2hvdWxkIGJlIHJldHJpZWRcbiAgICovXG4gIG1heFJldHJpZXM6IG51bWJlcjtcbn1cblxuZXhwb3J0IHR5cGUgUmVtb3RlUHJvdmlkZXJJbml0ID0gUGFydGlhbDxSZW1vdGVQcm92aWRlckNvbmZpZz47XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlckNvbmZpZ0Zyb21Jbml0KFxuICBpbml0OiBSZW1vdGVQcm92aWRlckluaXRcbik6IFJlbW90ZVByb3ZpZGVyQ29uZmlnIHtcbiAgY29uc3QgeyB0aW1lb3V0ID0gREVGQVVMVF9USU1FT1VULCBtYXhSZXRyaWVzID0gREVGQVVMVF9NQVhfUkVUUklFUyB9ID0gaW5pdDtcblxuICByZXR1cm4geyBtYXhSZXRyaWVzLCB0aW1lb3V0IH07XG59XG4iXX0=

/***/ }),

/***/ 54537:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var buffer_1 = __webpack_require__(64293);
var http_1 = __webpack_require__(98605);
var property_provider_1 = __webpack_require__(36772);
/**
 * @internal
 */
function httpGet(options) {
    return new Promise(function (resolve, reject) {
        var request = http_1.get(options);
        request.on("error", function (err) {
            reject(new property_provider_1.ProviderError("Unable to connect to instance metadata service"));
        });
        request.on("response", function (res) {
            var _a = res.statusCode, statusCode = _a === void 0 ? 400 : _a;
            if (statusCode < 200 || 300 <= statusCode) {
                reject(new property_provider_1.ProviderError("Error response received from instance metadata service"));
            }
            var chunks = [];
            res.on("data", function (chunk) {
                chunks.push(chunk);
            });
            res.on("end", function () {
                resolve(buffer_1.Buffer.concat(chunks));
            });
        });
    });
}
exports.httpGet = httpGet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cEdldC5qcyIsInNvdXJjZVJvb3QiOiIuL3NyYy8iLCJzb3VyY2VzIjpbInJlbW90ZVByb3ZpZGVyL2h0dHBHZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpQ0FBZ0M7QUFDaEMsNkJBQTREO0FBQzVELGdFQUEyRDtBQUUzRDs7R0FFRztBQUNILFNBQWdCLE9BQU8sQ0FBQyxPQUFnQztJQUN0RCxPQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFFLE1BQU07UUFDakMsSUFBTSxPQUFPLEdBQUcsVUFBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdCLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLFVBQUEsR0FBRztZQUNyQixNQUFNLENBQ0osSUFBSSxpQ0FBYSxDQUFDLGdEQUFnRCxDQUFDLENBQ3BFLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQUMsR0FBb0I7WUFDbEMsSUFBQSxtQkFBZ0IsRUFBaEIscUNBQWdCLENBQVM7WUFDakMsSUFBSSxVQUFVLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxVQUFVLEVBQUU7Z0JBQ3pDLE1BQU0sQ0FDSixJQUFJLGlDQUFhLENBQ2Ysd0RBQXdELENBQ3pELENBQ0YsQ0FBQzthQUNIO1lBRUQsSUFBTSxNQUFNLEdBQWtCLEVBQUUsQ0FBQztZQUNqQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFBLEtBQUs7Z0JBQ2xCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBZSxDQUFDLENBQUM7WUFDL0IsQ0FBQyxDQUFDLENBQUM7WUFDSCxHQUFHLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRTtnQkFDWixPQUFPLENBQUMsZUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUE1QkQsMEJBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcImJ1ZmZlclwiO1xuaW1wb3J0IHsgZ2V0LCBJbmNvbWluZ01lc3NhZ2UsIFJlcXVlc3RPcHRpb25zIH0gZnJvbSBcImh0dHBcIjtcbmltcG9ydCB7IFByb3ZpZGVyRXJyb3IgfSBmcm9tIFwiQGF3cy1zZGsvcHJvcGVydHktcHJvdmlkZXJcIjtcblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGh0dHBHZXQob3B0aW9uczogUmVxdWVzdE9wdGlvbnMgfCBzdHJpbmcpOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHJlcXVlc3QgPSBnZXQob3B0aW9ucyk7XG4gICAgcmVxdWVzdC5vbihcImVycm9yXCIsIGVyciA9PiB7XG4gICAgICByZWplY3QoXG4gICAgICAgIG5ldyBQcm92aWRlckVycm9yKFwiVW5hYmxlIHRvIGNvbm5lY3QgdG8gaW5zdGFuY2UgbWV0YWRhdGEgc2VydmljZVwiKVxuICAgICAgKTtcbiAgICB9KTtcblxuICAgIHJlcXVlc3Qub24oXCJyZXNwb25zZVwiLCAocmVzOiBJbmNvbWluZ01lc3NhZ2UpID0+IHtcbiAgICAgIGNvbnN0IHsgc3RhdHVzQ29kZSA9IDQwMCB9ID0gcmVzO1xuICAgICAgaWYgKHN0YXR1c0NvZGUgPCAyMDAgfHwgMzAwIDw9IHN0YXR1c0NvZGUpIHtcbiAgICAgICAgcmVqZWN0KFxuICAgICAgICAgIG5ldyBQcm92aWRlckVycm9yKFxuICAgICAgICAgICAgXCJFcnJvciByZXNwb25zZSByZWNlaXZlZCBmcm9tIGluc3RhbmNlIG1ldGFkYXRhIHNlcnZpY2VcIlxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY2h1bmtzOiBBcnJheTxCdWZmZXI+ID0gW107XG4gICAgICByZXMub24oXCJkYXRhXCIsIGNodW5rID0+IHtcbiAgICAgICAgY2h1bmtzLnB1c2goY2h1bmsgYXMgQnVmZmVyKTtcbiAgICAgIH0pO1xuICAgICAgcmVzLm9uKFwiZW5kXCIsICgpID0+IHtcbiAgICAgICAgcmVzb2x2ZShCdWZmZXIuY29uY2F0KGNodW5rcykpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuIl19

/***/ }),

/***/ 38267:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * @internal
 */
function retry(toRetry, maxRetries) {
    var promise = toRetry();
    for (var i = 0; i < maxRetries; i++) {
        promise = promise.catch(toRetry);
    }
    return promise;
}
exports.retry = retry;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmV0cnkuanMiLCJzb3VyY2VSb290IjoiLi9zcmMvIiwic291cmNlcyI6WyJyZW1vdGVQcm92aWRlci9yZXRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUlBOztHQUVHO0FBQ0gsU0FBZ0IsS0FBSyxDQUNuQixPQUE2QixFQUM3QixVQUFrQjtJQUVsQixJQUFJLE9BQU8sR0FBRyxPQUFPLEVBQUUsQ0FBQztJQUN4QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ25DLE9BQU8sR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ2xDO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQVZELHNCQVVDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGludGVyZmFjZSBSZXRyeWFibGVQcm92aWRlcjxUPiB7XG4gICgpOiBQcm9taXNlPFQ+O1xufVxuXG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmV0cnk8VD4oXG4gIHRvUmV0cnk6IFJldHJ5YWJsZVByb3ZpZGVyPFQ+LFxuICBtYXhSZXRyaWVzOiBudW1iZXJcbik6IFByb21pc2U8VD4ge1xuICBsZXQgcHJvbWlzZSA9IHRvUmV0cnkoKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXhSZXRyaWVzOyBpKyspIHtcbiAgICBwcm9taXNlID0gcHJvbWlzZS5jYXRjaCh0b1JldHJ5KTtcbiAgfVxuXG4gIHJldHVybiBwcm9taXNlO1xufVxuIl19

/***/ }),

/***/ 56902:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var property_provider_1 = __webpack_require__(36772);
var shared_ini_file_loader_1 = __webpack_require__(14894);
var DEFAULT_PROFILE = "default";
exports.ENV_PROFILE = "AWS_PROFILE";
function isStaticCredsProfile(arg) {
    return (Boolean(arg) &&
        typeof arg === "object" &&
        typeof arg.aws_access_key_id === "string" &&
        typeof arg.aws_secret_access_key === "string" &&
        ["undefined", "string"].indexOf(typeof arg.aws_session_token) > -1);
}
function isAssumeRoleProfile(arg) {
    return (Boolean(arg) &&
        typeof arg === "object" &&
        typeof arg.role_arn === "string" &&
        typeof arg.source_profile === "string" &&
        ["undefined", "string"].indexOf(typeof arg.role_session_name) > -1 &&
        ["undefined", "string"].indexOf(typeof arg.external_id) > -1 &&
        ["undefined", "string"].indexOf(typeof arg.mfa_serial) > -1);
}
/**
 * Creates a credential provider that will read from ini files and supports
 * role assumption and multi-factor authentication.
 */
function fromIni(init) {
    if (init === void 0) { init = {}; }
    return function () {
        return parseKnownFiles(init).then(function (profiles) {
            return resolveProfileData(getMasterProfileName(init), profiles, init);
        });
    };
}
exports.fromIni = fromIni;
function getMasterProfileName(init) {
    return init.profile || process.env[exports.ENV_PROFILE] || DEFAULT_PROFILE;
}
exports.getMasterProfileName = getMasterProfileName;
function resolveProfileData(profileName, profiles, options, visitedProfiles) {
    if (visitedProfiles === void 0) { visitedProfiles = {}; }
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a, data, ExternalId, mfa_serial, RoleArn, _b, RoleSessionName, source_profile, sourceCreds, params, _c, _d, _e;
        return tslib_1.__generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    data = profiles[profileName];
                    // If this is not the first profile visited, static credentials should be
                    // preferred over role assumption metadata. This special treatment of
                    // second and subsequent hops is to ensure compatibility with the AWS CLI.
                    if (Object.keys(visitedProfiles).length > 0 && isStaticCredsProfile(data)) {
                        return [2 /*return*/, resolveStaticCredentials(data)];
                    }
                    if (!isAssumeRoleProfile(data)) return [3 /*break*/, 4];
                    ExternalId = data.external_id, mfa_serial = data.mfa_serial, RoleArn = data.role_arn, _b = data.role_session_name, RoleSessionName = _b === void 0 ? "aws-sdk-js-" + Date.now() : _b, source_profile = data.source_profile;
                    if (!options.roleAssumer) {
                        throw new property_provider_1.ProviderError("Profile " + profileName + " requires a role to be assumed, but no" +
                            " role assumption callback was provided.", false);
                    }
                    if (source_profile in visitedProfiles) {
                        throw new property_provider_1.ProviderError("Detected a cycle attempting to resolve credentials for profile" +
                            (" " + getMasterProfileName(options) + ". Profiles visited: ") +
                            Object.keys(visitedProfiles).join(", "), false);
                    }
                    sourceCreds = resolveProfileData(source_profile, profiles, options, tslib_1.__assign({}, visitedProfiles, (_a = {}, _a[source_profile] = true, _a)));
                    params = { RoleArn: RoleArn, RoleSessionName: RoleSessionName, ExternalId: ExternalId };
                    if (!mfa_serial) return [3 /*break*/, 2];
                    if (!options.mfaCodeProvider) {
                        throw new property_provider_1.ProviderError("Profile " + profileName + " requires multi-factor authentication," +
                            " but no MFA code callback was provided.", false);
                    }
                    params.SerialNumber = mfa_serial;
                    _c = params;
                    return [4 /*yield*/, options.mfaCodeProvider(mfa_serial)];
                case 1:
                    _c.TokenCode = _f.sent();
                    _f.label = 2;
                case 2:
                    _e = (_d = options).roleAssumer;
                    return [4 /*yield*/, sourceCreds];
                case 3: return [2 /*return*/, _e.apply(_d, [_f.sent(), params])];
                case 4:
                    // If no role assumption metadata is present, attempt to load static
                    // credentials from the selected profile.
                    if (isStaticCredsProfile(data)) {
                        return [2 /*return*/, resolveStaticCredentials(data)];
                    }
                    // If the profile cannot be parsed or contains neither static credentials
                    // nor role assumption metadata, throw an error. This should be considered a
                    // terminal resolution error if a profile has been specified by the user
                    // (whether via a parameter, an environment variable, or another profile's
                    // `source_profile` key).
                    throw new property_provider_1.ProviderError("Profile " + profileName + " could not be found or parsed in shared" +
                        " credentials file.");
            }
        });
    });
}
function parseKnownFiles(init) {
    var _a = init.loadedConfig, loadedConfig = _a === void 0 ? shared_ini_file_loader_1.loadSharedConfigFiles(init) : _a;
    return loadedConfig.then(function (parsedFiles) {
        var configFile = parsedFiles.configFile, credentialsFile = parsedFiles.credentialsFile;
        return tslib_1.__assign({}, configFile, credentialsFile);
    });
}
exports.parseKnownFiles = parseKnownFiles;
function resolveStaticCredentials(profile) {
    return Promise.resolve({
        accessKeyId: profile.aws_access_key_id,
        secretAccessKey: profile.aws_secret_access_key,
        sessionToken: profile.aws_session_token
    });
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 44091:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const property_provider_1 = __webpack_require__(36772);
const credential_provider_env_1 = __webpack_require__(47579);
const credential_provider_imds_1 = __webpack_require__(3496);
const credential_provider_ini_1 = __webpack_require__(56902);
const credential_provider_process_1 = __webpack_require__(3711);
exports.ENV_IMDS_DISABLED = "AWS_EC2_METADATA_DISABLED";
/**
 * Creates a credential provider that will attempt to find credentials from the
 * following sources (listed in order of precedence):
 *   * Environment variables exposed via `process.env`
 *   * Shared credentials and config ini files
 *   * The EC2/ECS Instance Metadata Service
 *
 * The default credential provider will invoke one provider at a time and only
 * continue to the next if no credentials have been located. For example, if
 * the process finds values defined via the `AWS_ACCESS_KEY_ID` and
 * `AWS_SECRET_ACCESS_KEY` environment variables, the files at
 * `~/.aws/credentials` and `~/.aws/config` will not be read, nor will any
 * messages be sent to the Instance Metadata Service.
 *
 * @param init                  Configuration that is passed to each individual
 *                              provider
 *
 * @see fromEnv                 The function used to source credentials from
 *                              environment variables
 * @see fromIni                 The function used to source credentials from INI
 *                              files
 * @see fromProcess             The functino used to sources credentials from
 *                              credential_process in INI files
 * @see fromInstanceMetadata    The function used to source credentials from the
 *                              EC2 Instance Metadata Service
 * @see fromContainerMetadata   The function used to source credentials from the
 *                              ECS Container Metadata Service
 */
function defaultProvider(init = {}) {
    const { profile = process.env[credential_provider_ini_1.ENV_PROFILE] } = init;
    const providerChain = profile
        ? credential_provider_ini_1.fromIni(init)
        : property_provider_1.chain(credential_provider_env_1.fromEnv(), credential_provider_ini_1.fromIni(init), credential_provider_process_1.fromProcess(init), remoteProvider(init));
    return property_provider_1.memoize(providerChain, credentials => credentials.expiration !== undefined &&
        credentials.expiration - getEpochTs() < 300, credentials => credentials.expiration !== undefined);
}
exports.defaultProvider = defaultProvider;
function getEpochTs() {
    return Math.floor(Date.now() / 1000);
}
function remoteProvider(init) {
    if (process.env[credential_provider_imds_1.ENV_CMDS_RELATIVE_URI] || process.env[credential_provider_imds_1.ENV_CMDS_FULL_URI]) {
        return credential_provider_imds_1.fromContainerMetadata(init);
    }
    if (process.env[exports.ENV_IMDS_DISABLED]) {
        return () => Promise.reject(new property_provider_1.ProviderError("EC2 Instance Metadata Service access disabled"));
    }
    return credential_provider_imds_1.fromInstanceMetadata(init);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxrRUFBMkU7QUFDM0UsOEVBQTJEO0FBQzNELGdGQU0yQztBQUMzQyw4RUFJMEM7QUFDMUMsc0ZBRzhDO0FBR2pDLFFBQUEsaUJBQWlCLEdBQUcsMkJBQTJCLENBQUM7QUFFN0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQTJCRztBQUNILFNBQWdCLGVBQWUsQ0FDN0IsT0FBMkQsRUFBRTtJQUU3RCxNQUFNLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMscUNBQVcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ3BELE1BQU0sYUFBYSxHQUFHLE9BQU87UUFDM0IsQ0FBQyxDQUFDLGlDQUFPLENBQUMsSUFBSSxDQUFDO1FBQ2YsQ0FBQyxDQUFDLHlCQUFLLENBQUMsaUNBQU8sRUFBRSxFQUFFLGlDQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUseUNBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUU3RSxPQUFPLDJCQUFPLENBQ1osYUFBYSxFQUNiLFdBQVcsQ0FBQyxFQUFFLENBQ1osV0FBVyxDQUFDLFVBQVUsS0FBSyxTQUFTO1FBQ3BDLFdBQVcsQ0FBQyxVQUFVLEdBQUcsVUFBVSxFQUFFLEdBQUcsR0FBRyxFQUM3QyxXQUFXLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEtBQUssU0FBUyxDQUNwRCxDQUFDO0FBQ0osQ0FBQztBQWZELDBDQWVDO0FBRUQsU0FBUyxVQUFVO0lBQ2pCLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVELFNBQVMsY0FBYyxDQUFDLElBQXdCO0lBQzlDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxnREFBcUIsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsNENBQWlCLENBQUMsRUFBRTtRQUN4RSxPQUFPLGdEQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ3BDO0lBRUQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUFpQixDQUFDLEVBQUU7UUFDbEMsT0FBTyxHQUFHLEVBQUUsQ0FDVixPQUFPLENBQUMsTUFBTSxDQUNaLElBQUksaUNBQWEsQ0FBQywrQ0FBK0MsQ0FBQyxDQUNuRSxDQUFDO0tBQ0w7SUFFRCxPQUFPLCtDQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjaGFpbiwgbWVtb2l6ZSwgUHJvdmlkZXJFcnJvciB9IGZyb20gXCJAYXdzLXNkay9wcm9wZXJ0eS1wcm92aWRlclwiO1xuaW1wb3J0IHsgZnJvbUVudiB9IGZyb20gXCJAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVyLWVudlwiO1xuaW1wb3J0IHtcbiAgRU5WX0NNRFNfRlVMTF9VUkksXG4gIEVOVl9DTURTX1JFTEFUSVZFX1VSSSxcbiAgZnJvbUNvbnRhaW5lck1ldGFkYXRhLFxuICBmcm9tSW5zdGFuY2VNZXRhZGF0YSxcbiAgUmVtb3RlUHJvdmlkZXJJbml0XG59IGZyb20gXCJAYXdzLXNkay9jcmVkZW50aWFsLXByb3ZpZGVyLWltZHNcIjtcbmltcG9ydCB7XG4gIEVOVl9QUk9GSUxFLFxuICBmcm9tSW5pLFxuICBGcm9tSW5pSW5pdFxufSBmcm9tIFwiQGF3cy1zZGsvY3JlZGVudGlhbC1wcm92aWRlci1pbmlcIjtcbmltcG9ydCB7XG4gIGZyb21Qcm9jZXNzLFxuICBGcm9tUHJvY2Vzc0luaXRcbn0gZnJvbSBcIkBhd3Mtc2RrL2NyZWRlbnRpYWwtcHJvdmlkZXItcHJvY2Vzc1wiO1xuaW1wb3J0IHsgQ3JlZGVudGlhbFByb3ZpZGVyIH0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5cbmV4cG9ydCBjb25zdCBFTlZfSU1EU19ESVNBQkxFRCA9IFwiQVdTX0VDMl9NRVRBREFUQV9ESVNBQkxFRFwiO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBjcmVkZW50aWFsIHByb3ZpZGVyIHRoYXQgd2lsbCBhdHRlbXB0IHRvIGZpbmQgY3JlZGVudGlhbHMgZnJvbSB0aGVcbiAqIGZvbGxvd2luZyBzb3VyY2VzIChsaXN0ZWQgaW4gb3JkZXIgb2YgcHJlY2VkZW5jZSk6XG4gKiAgICogRW52aXJvbm1lbnQgdmFyaWFibGVzIGV4cG9zZWQgdmlhIGBwcm9jZXNzLmVudmBcbiAqICAgKiBTaGFyZWQgY3JlZGVudGlhbHMgYW5kIGNvbmZpZyBpbmkgZmlsZXNcbiAqICAgKiBUaGUgRUMyL0VDUyBJbnN0YW5jZSBNZXRhZGF0YSBTZXJ2aWNlXG4gKlxuICogVGhlIGRlZmF1bHQgY3JlZGVudGlhbCBwcm92aWRlciB3aWxsIGludm9rZSBvbmUgcHJvdmlkZXIgYXQgYSB0aW1lIGFuZCBvbmx5XG4gKiBjb250aW51ZSB0byB0aGUgbmV4dCBpZiBubyBjcmVkZW50aWFscyBoYXZlIGJlZW4gbG9jYXRlZC4gRm9yIGV4YW1wbGUsIGlmXG4gKiB0aGUgcHJvY2VzcyBmaW5kcyB2YWx1ZXMgZGVmaW5lZCB2aWEgdGhlIGBBV1NfQUNDRVNTX0tFWV9JRGAgYW5kXG4gKiBgQVdTX1NFQ1JFVF9BQ0NFU1NfS0VZYCBlbnZpcm9ubWVudCB2YXJpYWJsZXMsIHRoZSBmaWxlcyBhdFxuICogYH4vLmF3cy9jcmVkZW50aWFsc2AgYW5kIGB+Ly5hd3MvY29uZmlnYCB3aWxsIG5vdCBiZSByZWFkLCBub3Igd2lsbCBhbnlcbiAqIG1lc3NhZ2VzIGJlIHNlbnQgdG8gdGhlIEluc3RhbmNlIE1ldGFkYXRhIFNlcnZpY2UuXG4gKlxuICogQHBhcmFtIGluaXQgICAgICAgICAgICAgICAgICBDb25maWd1cmF0aW9uIHRoYXQgaXMgcGFzc2VkIHRvIGVhY2ggaW5kaXZpZHVhbFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlclxuICpcbiAqIEBzZWUgZnJvbUVudiAgICAgICAgICAgICAgICAgVGhlIGZ1bmN0aW9uIHVzZWQgdG8gc291cmNlIGNyZWRlbnRpYWxzIGZyb21cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gKiBAc2VlIGZyb21JbmkgICAgICAgICAgICAgICAgIFRoZSBmdW5jdGlvbiB1c2VkIHRvIHNvdXJjZSBjcmVkZW50aWFscyBmcm9tIElOSVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlc1xuICogQHNlZSBmcm9tUHJvY2VzcyAgICAgICAgICAgICBUaGUgZnVuY3Rpbm8gdXNlZCB0byBzb3VyY2VzIGNyZWRlbnRpYWxzIGZyb21cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3JlZGVudGlhbF9wcm9jZXNzIGluIElOSSBmaWxlc1xuICogQHNlZSBmcm9tSW5zdGFuY2VNZXRhZGF0YSAgICBUaGUgZnVuY3Rpb24gdXNlZCB0byBzb3VyY2UgY3JlZGVudGlhbHMgZnJvbSB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgRUMyIEluc3RhbmNlIE1ldGFkYXRhIFNlcnZpY2VcbiAqIEBzZWUgZnJvbUNvbnRhaW5lck1ldGFkYXRhICAgVGhlIGZ1bmN0aW9uIHVzZWQgdG8gc291cmNlIGNyZWRlbnRpYWxzIGZyb20gdGhlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEVDUyBDb250YWluZXIgTWV0YWRhdGEgU2VydmljZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFByb3ZpZGVyKFxuICBpbml0OiBGcm9tSW5pSW5pdCAmIFJlbW90ZVByb3ZpZGVySW5pdCAmIEZyb21Qcm9jZXNzSW5pdCA9IHt9XG4pOiBDcmVkZW50aWFsUHJvdmlkZXIge1xuICBjb25zdCB7IHByb2ZpbGUgPSBwcm9jZXNzLmVudltFTlZfUFJPRklMRV0gfSA9IGluaXQ7XG4gIGNvbnN0IHByb3ZpZGVyQ2hhaW4gPSBwcm9maWxlXG4gICAgPyBmcm9tSW5pKGluaXQpXG4gICAgOiBjaGFpbihmcm9tRW52KCksIGZyb21JbmkoaW5pdCksIGZyb21Qcm9jZXNzKGluaXQpLCByZW1vdGVQcm92aWRlcihpbml0KSk7XG5cbiAgcmV0dXJuIG1lbW9pemUoXG4gICAgcHJvdmlkZXJDaGFpbixcbiAgICBjcmVkZW50aWFscyA9PlxuICAgICAgY3JlZGVudGlhbHMuZXhwaXJhdGlvbiAhPT0gdW5kZWZpbmVkICYmXG4gICAgICBjcmVkZW50aWFscy5leHBpcmF0aW9uIC0gZ2V0RXBvY2hUcygpIDwgMzAwLFxuICAgIGNyZWRlbnRpYWxzID0+IGNyZWRlbnRpYWxzLmV4cGlyYXRpb24gIT09IHVuZGVmaW5lZFxuICApO1xufVxuXG5mdW5jdGlvbiBnZXRFcG9jaFRzKCkge1xuICByZXR1cm4gTWF0aC5mbG9vcihEYXRlLm5vdygpIC8gMTAwMCk7XG59XG5cbmZ1bmN0aW9uIHJlbW90ZVByb3ZpZGVyKGluaXQ6IFJlbW90ZVByb3ZpZGVySW5pdCk6IENyZWRlbnRpYWxQcm92aWRlciB7XG4gIGlmIChwcm9jZXNzLmVudltFTlZfQ01EU19SRUxBVElWRV9VUkldIHx8IHByb2Nlc3MuZW52W0VOVl9DTURTX0ZVTExfVVJJXSkge1xuICAgIHJldHVybiBmcm9tQ29udGFpbmVyTWV0YWRhdGEoaW5pdCk7XG4gIH1cblxuICBpZiAocHJvY2Vzcy5lbnZbRU5WX0lNRFNfRElTQUJMRURdKSB7XG4gICAgcmV0dXJuICgpID0+XG4gICAgICBQcm9taXNlLnJlamVjdChcbiAgICAgICAgbmV3IFByb3ZpZGVyRXJyb3IoXCJFQzIgSW5zdGFuY2UgTWV0YWRhdGEgU2VydmljZSBhY2Nlc3MgZGlzYWJsZWRcIilcbiAgICAgICk7XG4gIH1cblxuICByZXR1cm4gZnJvbUluc3RhbmNlTWV0YWRhdGEoaW5pdCk7XG59XG4iXX0=

/***/ }),

/***/ 3711:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var property_provider_1 = __webpack_require__(36772);
var child_process_1 = __webpack_require__(63129);
var credential_provider_ini_1 = __webpack_require__(56902);
var DEFAULT_PROFILE = "default";
exports.ENV_PROFILE = "AWS_PROFILE";
/**
 * Creates a credential provider that will read from a credential_process specified
 * in ini files.
 */
function fromProcess(init) {
    if (init === void 0) { init = {}; }
    return function () {
        return credential_provider_ini_1.parseKnownFiles(init).then(function (profiles) {
            return resolveProcessCredentials(credential_provider_ini_1.getMasterProfileName(init), profiles, init);
        });
    };
}
exports.fromProcess = fromProcess;
function resolveProcessCredentials(profileName, profiles, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var profile, credentialProcess;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    profile = profiles[profileName];
                    if (!profiles[profileName]) return [3 /*break*/, 4];
                    credentialProcess = profile["credential_process"];
                    if (!(credentialProcess !== undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, execPromise(credentialProcess)
                            .then(function (processResult) {
                            var data;
                            try {
                                data = JSON.parse(processResult);
                            }
                            catch (_a) {
                                throw Error("Profile " + profileName + " credential_process returned invalid JSON.");
                            }
                            var version = data.Version, accessKeyId = data.AccessKeyId, secretAccessKey = data.SecretAccessKey, sessionToken = data.SessionToken, expiration = data.Expiration;
                            if (version !== 1) {
                                throw Error("Profile " + profileName + " credential_process did not return Version 1.");
                            }
                            if (accessKeyId === undefined || secretAccessKey === undefined) {
                                throw Error("Profile " + profileName + " credential_process returned invalid credentials.");
                            }
                            var expirationUnix;
                            if (expiration) {
                                var currentTime = new Date();
                                var expireTime = new Date(expiration);
                                if (expireTime < currentTime) {
                                    throw Error("Profile " + profileName + " credential_process returned expired credentials.");
                                }
                                expirationUnix = Math.floor(new Date(expiration).valueOf() / 1000);
                            }
                            return {
                                accessKeyId: accessKeyId,
                                secretAccessKey: secretAccessKey,
                                sessionToken: sessionToken,
                                expirationUnix: expirationUnix
                            };
                        })
                            .catch(function (error) {
                            throw new property_provider_1.ProviderError(error.message);
                        })];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: throw new property_provider_1.ProviderError("Profile " + profileName + " did not contain credential_process.");
                case 3: return [3 /*break*/, 5];
                case 4: 
                // If the profile cannot be parsed or does not contain the default or
                // specified profile throw an error. This should be considered a terminal
                // resolution error if a profile has been specified by the user (whether via
                // a parameter, anenvironment variable, or another profile's `source_profile` key).
                throw new property_provider_1.ProviderError("Profile " + profileName + " could not be found in shared credentials file.");
                case 5: return [2 /*return*/];
            }
        });
    });
}
function execPromise(command) {
    return new Promise(function (resolve, reject) {
        child_process_1.exec(command, function (error, stdout, stderr) {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout.trim());
        });
    });
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 53612:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const buffer_1 = __webpack_require__(64293);
const util_buffer_from_1 = __webpack_require__(65574);
const crypto_1 = __webpack_require__(76417);
class Hash {
    constructor(algorithmIdentifier, secret) {
        this.hash = secret
            ? crypto_1.createHmac(algorithmIdentifier, castSourceData(secret))
            : crypto_1.createHash(algorithmIdentifier);
    }
    update(toHash, encoding) {
        this.hash.update(castSourceData(toHash, encoding));
    }
    digest() {
        return Promise.resolve(this.hash.digest());
    }
}
exports.Hash = Hash;
function castSourceData(toCast, encoding) {
    if (buffer_1.Buffer.isBuffer(toCast)) {
        return toCast;
    }
    if (typeof toCast === "string") {
        return util_buffer_from_1.fromString(toCast, encoding);
    }
    if (ArrayBuffer.isView(toCast)) {
        return util_buffer_from_1.fromArrayBuffer(toCast.buffer, toCast.byteOffset, toCast.byteLength);
    }
    return util_buffer_from_1.fromArrayBuffer(toCast);
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 74200:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const stream_1 = __webpack_require__(92413);
class HashCalculator extends stream_1.Writable {
    constructor(hash, options) {
        super(options);
        this.hash = hash;
    }
    _write(chunk, encoding, callback) {
        try {
            this.hash.update(chunk);
        }
        catch (err) {
            return callback(err);
        }
        callback();
    }
}
exports.HashCalculator = HashCalculator;
//# sourceMappingURL=hash-calculator.js.map

/***/ }),

/***/ 95594:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const hash_calculator_1 = __webpack_require__(74200);
const fs_1 = __webpack_require__(35747);
exports.calculateSha256 = function calculateSha256(hashCtor, fileStream) {
    return new Promise((resolve, reject) => {
        if (!isReadStream(fileStream)) {
            reject(new Error("Unable to calculate hash for non-file streams."));
            return;
        }
        const fileStreamTee = fs_1.createReadStream(fileStream.path, {
            start: fileStream.start,
            end: fileStream.end
        });
        const hash = new hashCtor();
        const hashCalculator = new hash_calculator_1.HashCalculator(hash);
        fileStreamTee.pipe(hashCalculator);
        fileStreamTee.on("error", (err) => {
            // if the source errors, the destination stream needs to manually end
            hashCalculator.end();
            reject(err);
        });
        hashCalculator.on("error", reject);
        hashCalculator.on("finish", function () {
            hash
                .digest()
                .then(resolve)
                .catch(reject);
        });
    });
};
function isReadStream(stream) {
    return typeof stream.path === "string";
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 47749:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function isArrayBuffer(arg) {
    return ((typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer) ||
        Object.prototype.toString.call(arg) === "[object ArrayBuffer]");
}
exports.isArrayBuffer = isArrayBuffer;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6617:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function isIterable(arg) {
    return (Boolean(arg) &&
        typeof Symbol !== "undefined" &&
        typeof arg[Symbol.iterator] === "function");
}
exports.isIterable = isIterable;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 95686:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function locationConstraintMiddleware(regionProvider) {
    var _this = this;
    return function (next) { return function (args) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var region, CreateBucketConfiguration;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, regionProvider()];
                case 1:
                    region = _a.sent();
                    CreateBucketConfiguration = args.input.CreateBucketConfiguration;
                    if (!CreateBucketConfiguration ||
                        !CreateBucketConfiguration.LocationConstraint) {
                        args = tslib_1.__assign({}, args, { input: tslib_1.__assign({}, args.input, { CreateBucketConfiguration: { LocationConstraint: region } }) });
                    }
                    else if (region === "us-east-1") {
                        args = tslib_1.__assign({}, args, { input: tslib_1.__assign({}, args.input, { CreateBucketConfiguration: undefined }) });
                    }
                    return [2 /*return*/, next(args)];
            }
        });
    }); }; };
}
exports.locationConstraintMiddleware = locationConstraintMiddleware;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 40802:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function contentLengthMiddleware(bodyLengthCalculator) {
    var _this = this;
    return function (next) { return function (args) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var request, body, headers, length;
        return tslib_1.__generator(this, function (_a) {
            request = tslib_1.__assign({}, args.request);
            body = request.body, headers = request.headers;
            if (body &&
                Object.keys(headers)
                    .map(function (str) { return str.toLowerCase(); })
                    .indexOf("content-length") === -1) {
                length = bodyLengthCalculator(body);
                if (length !== undefined) {
                    request.headers = tslib_1.__assign({}, request.headers, { "Content-Length": String(length) });
                }
            }
            return [2 /*return*/, next(tslib_1.__assign({}, args, { request: request }))];
        });
    }); }; };
}
exports.contentLengthMiddleware = contentLengthMiddleware;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 62645:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var middleware_header_default_1 = __webpack_require__(26385);
function addExpectContinue(next, context) {
    return function (args) {
        if (args.request.body) {
            return middleware_header_default_1.headerDefault({
                Expect: "100-continue"
            })(next, context)(args);
        }
        else {
            return next(args);
        }
    };
}
exports.addExpectContinue = addExpectContinue;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSxnRkFBbUU7QUFFbkUsU0FBZ0IsaUJBQWlCLENBQy9CLElBQWlDLEVBQ2pDLE9BQWdDO0lBRWhDLE9BQU8sVUFBQyxJQUFxQztRQUMzQyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFO1lBQ3JCLE9BQU8seUNBQWEsQ0FBQztnQkFDbkIsTUFBTSxFQUFFLGNBQWM7YUFDdkIsQ0FBQyxDQUNBLElBQUksRUFDSixPQUFPLENBQ1IsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNUO2FBQU07WUFDTCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNuQjtJQUNILENBQUMsQ0FBQztBQUNKLENBQUM7QUFoQkQsOENBZ0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQnVpbGRIYW5kbGVyLFxuICBCdWlsZEhhbmRsZXJBcmd1bWVudHMsXG4gIEhhbmRsZXJFeGVjdXRpb25Db250ZXh0XG59IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG5pbXBvcnQgeyBoZWFkZXJEZWZhdWx0IH0gZnJvbSBcIkBhd3Mtc2RrL21pZGRsZXdhcmUtaGVhZGVyLWRlZmF1bHRcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEV4cGVjdENvbnRpbnVlKFxuICBuZXh0OiBCdWlsZEhhbmRsZXI8YW55LCBhbnksIGFueT4sXG4gIGNvbnRleHQ6IEhhbmRsZXJFeGVjdXRpb25Db250ZXh0XG4pIHtcbiAgcmV0dXJuIChhcmdzOiBCdWlsZEhhbmRsZXJBcmd1bWVudHM8YW55LCBhbnk+KSA9PiB7XG4gICAgaWYgKGFyZ3MucmVxdWVzdC5ib2R5KSB7XG4gICAgICByZXR1cm4gaGVhZGVyRGVmYXVsdCh7XG4gICAgICAgIEV4cGVjdDogXCIxMDAtY29udGludWVcIlxuICAgICAgfSkoXG4gICAgICAgIG5leHQsXG4gICAgICAgIGNvbnRleHRcbiAgICAgICkoYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBuZXh0KGFyZ3MpO1xuICAgIH1cbiAgfTtcbn1cbiJdfQ==

/***/ }),

/***/ 26385:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function headerDefault(headerBag) {
    return function (next) {
        return function (args) {
            var e_1, _a;
            var headers = tslib_1.__assign({}, args.request.headers);
            try {
                for (var _b = tslib_1.__values(Object.keys(headerBag)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var name = _c.value;
                    if (!(name in headers)) {
                        headers[name] = headerBag[name];
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return next(tslib_1.__assign({}, args, { request: tslib_1.__assign({}, args.request, { headers: headers }) }));
        };
    };
}
exports.headerDefault = headerDefault;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 15910:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function serializerMiddleware(requestSerializerProvider) {
    var _this = this;
    return function (next, _a) {
        var model = _a.model;
        return function (args) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var requestSerializer, request;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, requestSerializerProvider()];
                    case 1:
                        requestSerializer = _a.sent();
                        request = requestSerializer.serialize(model, args.input);
                        if (request.body && ["GET", "HEAD"].indexOf(request.method) >= 0) {
                            // remove body for GET/HEAD requests (fetch complains)
                            delete request.body;
                        }
                        return [2 /*return*/, next(tslib_1.__assign({}, args, { request: request }))];
                }
            });
        }); };
    };
}
exports.serializerMiddleware = serializerMiddleware;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 7936:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var MiddlewareStack = /** @class */ (function () {
    function MiddlewareStack() {
        this.entries = [];
        this.sorted = true;
    }
    MiddlewareStack.prototype.add = function (middleware, options) {
        if (options === void 0) { options = {}; }
        var _a = options.step, step = _a === void 0 ? "initialize" : _a, _b = options.priority, priority = _b === void 0 ? 0 : _b, tags = options.tags;
        this.sorted = false;
        this.entries.push({
            middleware: middleware,
            priority: priority,
            step: step,
            tags: tags
        });
    };
    MiddlewareStack.prototype.clone = function () {
        var _a;
        var clone = new MiddlewareStack();
        (_a = clone.entries).push.apply(_a, this.entries);
        clone.sorted = this.sorted;
        return clone;
    };
    MiddlewareStack.prototype.concat = function (from) {
        var _a;
        var clone = new MiddlewareStack();
        (_a = clone.entries).push.apply(_a, this.entries.concat(from.entries));
        clone.sorted = false;
        return clone;
    };
    MiddlewareStack.prototype.remove = function (toRemove) {
        var length = this.entries.length;
        if (typeof toRemove === "string") {
            this.removeByTag(toRemove);
        }
        else {
            this.removeByIdentity(toRemove);
        }
        return this.entries.length < length;
    };
    MiddlewareStack.prototype.filter = function (callbackfn) {
        var filtered = new MiddlewareStack();
        for (var _i = 0, _a = this.entries; _i < _a.length; _i++) {
            var entry = _a[_i];
            var options = {
                step: entry.step,
                priority: entry.priority,
                tags: tslib_1.__assign({}, entry.tags)
            };
            if (callbackfn(options)) {
                filtered.entries.push(entry);
            }
        }
        filtered.sorted = this.sorted;
        return filtered;
    };
    MiddlewareStack.prototype.resolve = function (handler, context) {
        if (!this.sorted) {
            this.sort();
        }
        for (var _i = 0, _a = this.entries; _i < _a.length; _i++) {
            var middleware = _a[_i].middleware;
            handler = middleware(handler, context);
        }
        return handler;
    };
    MiddlewareStack.prototype.removeByIdentity = function (toRemove) {
        for (var i = this.entries.length - 1; i >= 0; i--) {
            if (this.entries[i].middleware === toRemove) {
                this.entries.splice(i, 1);
            }
        }
    };
    MiddlewareStack.prototype.removeByTag = function (toRemove) {
        for (var i = this.entries.length - 1; i >= 0; i--) {
            var tags = this.entries[i].tags;
            if (tags && toRemove in tags) {
                this.entries.splice(i, 1);
            }
        }
    };
    MiddlewareStack.prototype.sort = function () {
        this.entries.sort(function (a, b) {
            var stepWeight = stepWeights[a.step] - stepWeights[b.step];
            return stepWeight || a.priority - b.priority;
        });
        this.sorted = true;
    };
    return MiddlewareStack;
}());
exports.MiddlewareStack = MiddlewareStack;
var stepWeights = {
    initialize: 4,
    serialize: 3,
    build: 2,
    finalize: 1
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBK0JBO0lBQUE7UUFLbUIsWUFBTyxHQUFtRCxFQUFFLENBQUM7UUFDdEUsV0FBTSxHQUFZLElBQUksQ0FBQztJQTZIakMsQ0FBQztJQXZHQyw2QkFBRyxHQUFILFVBQ0UsVUFBcUMsRUFDckMsT0FBNEI7UUFBNUIsd0JBQUEsRUFBQSxZQUE0QjtRQUVwQixJQUFBLGlCQUFtQixFQUFuQix3Q0FBbUIsRUFBRSxxQkFBWSxFQUFaLGlDQUFZLEVBQUUsbUJBQUksQ0FBYTtRQUM1RCxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztZQUNoQixVQUFVLFlBQUE7WUFDVixRQUFRLFVBQUE7WUFDUixJQUFJLE1BQUE7WUFDSixJQUFJLE1BQUE7U0FDTCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsK0JBQUssR0FBTDs7UUFDRSxJQUFNLEtBQUssR0FBRyxJQUFJLGVBQWUsRUFBeUIsQ0FBQztRQUMzRCxDQUFBLEtBQUEsS0FBSyxDQUFDLE9BQU8sQ0FBQSxDQUFDLElBQUksV0FBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ3BDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMzQixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxnQ0FBTSxHQUFOLFVBQ0UsSUFBb0Q7O1FBRXBELElBQU0sS0FBSyxHQUFHLElBQUksZUFBZSxFQUFpQyxDQUFDO1FBQ25FLENBQUEsS0FBQSxLQUFLLENBQUMsT0FBTyxDQUFBLENBQUMsSUFBSSxXQUFLLElBQUksQ0FBQyxPQUFlLFFBQUssSUFBSSxDQUFDLE9BQU8sR0FBRTtRQUM5RCxLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNyQixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxnQ0FBTSxHQUFOLFVBQU8sUUFBNEM7UUFDekMsSUFBQSw0QkFBTSxDQUFrQjtRQUNoQyxJQUFJLE9BQU8sUUFBUSxLQUFLLFFBQVEsRUFBRTtZQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQzVCO2FBQU07WUFDTCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDakM7UUFFRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN0QyxDQUFDO0lBRUQsZ0NBQU0sR0FBTixVQUNFLFVBQXVEO1FBRXZELElBQU0sUUFBUSxHQUFHLElBQUksZUFBZSxFQUF5QixDQUFDO1FBQzlELEtBQW9CLFVBQVksRUFBWixLQUFBLElBQUksQ0FBQyxPQUFPLEVBQVosY0FBWSxFQUFaLElBQVksRUFBRTtZQUE3QixJQUFNLEtBQUssU0FBQTtZQUNkLElBQU0sT0FBTyxHQUFtQjtnQkFDOUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNoQixRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVE7Z0JBQ3hCLElBQUksdUJBQ0MsS0FBSyxDQUFDLElBQUksQ0FDZDthQUNGLENBQUM7WUFDRixJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDdkIsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDOUI7U0FDRjtRQUNELFFBQVEsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUM5QixPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBRUQsaUNBQU8sR0FBUCxVQUNFLE9BQXVELEVBQ3ZELE9BQWdDO1FBRWhDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNiO1FBRUQsS0FBNkIsVUFBWSxFQUFaLEtBQUEsSUFBSSxDQUFDLE9BQU8sRUFBWixjQUFZLEVBQVosSUFBWSxFQUFFO1lBQTlCLElBQUEsOEJBQVU7WUFDckIsT0FBTyxHQUFHLFVBQVUsQ0FDbEIsT0FBcUMsRUFDckMsT0FBTyxDQUNELENBQUM7U0FDVjtRQUVELE9BQU8sT0FBeUMsQ0FBQztJQUNuRCxDQUFDO0lBRU8sMENBQWdCLEdBQXhCLFVBQXlCLFFBQW1DO1FBQzFELEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDakQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsS0FBSyxRQUFRLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUMzQjtTQUNGO0lBQ0gsQ0FBQztJQUVPLHFDQUFXLEdBQW5CLFVBQW9CLFFBQWdCO1FBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDekMsSUFBQSwyQkFBSSxDQUFxQjtZQUNqQyxJQUFJLElBQUksSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO2dCQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDM0I7U0FDRjtJQUNILENBQUM7SUFFTyw4QkFBSSxHQUFaO1FBQ0UsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBQyxDQUFDLEVBQUUsQ0FBQztZQUNyQixJQUFNLFVBQVUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDN0QsT0FBTyxVQUFVLElBQUksQ0FBQyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDO1FBQy9DLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUNILHNCQUFDO0FBQUQsQ0FBQyxBQW5JRCxJQW1JQztBQW5JWSwwQ0FBZTtBQXFJNUIsSUFBTSxXQUFXLEdBQUc7SUFDbEIsVUFBVSxFQUFFLENBQUM7SUFDYixTQUFTLEVBQUUsQ0FBQztJQUNaLEtBQUssRUFBRSxDQUFDO0lBQ1IsUUFBUSxFQUFFLENBQUM7Q0FDWixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQnVpbGRIYW5kbGVyT3B0aW9ucyxcbiAgRmluYWxpemVIYW5kbGVyLFxuICBGaW5hbGl6ZUhhbmRsZXJPcHRpb25zLFxuICBGaW5hbGl6ZU1pZGRsZXdhcmUsXG4gIEhhbmRsZXIsXG4gIEhhbmRsZXJFeGVjdXRpb25Db250ZXh0LFxuICBIYW5kbGVyT3B0aW9ucyxcbiAgTWlkZGxld2FyZSxcbiAgTWlkZGxld2FyZVN0YWNrIGFzIElNaWRkbGV3YXJlU3RhY2ssXG4gIFNlcmlhbGl6ZUhhbmRsZXJPcHRpb25zLFxuICBTdGVwXG59IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG5pbnRlcmZhY2UgSGFuZGxlckxpc3RFbnRyeTxcbiAgSW5wdXQgZXh0ZW5kcyBvYmplY3QsXG4gIE91dHB1dCBleHRlbmRzIG9iamVjdCxcbiAgU3RyZWFtXG4+IHtcbiAgc3RlcDogU3RlcDtcbiAgcHJpb3JpdHk6IG51bWJlcjtcbiAgbWlkZGxld2FyZTogTWlkZGxld2FyZTxJbnB1dCwgT3V0cHV0PjtcbiAgdGFncz86IHsgW3RhZzogc3RyaW5nXTogYW55IH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWlkZGxld2FyZVN0YWNrPFxuICBJbnB1dCBleHRlbmRzIG9iamVjdCxcbiAgT3V0cHV0IGV4dGVuZHMgb2JqZWN0LFxuICBTdHJlYW0gPSBVaW50OEFycmF5XG4+IGV4dGVuZHMgSU1pZGRsZXdhcmVTdGFjazxJbnB1dCwgT3V0cHV0LCBTdHJlYW0+IHt9XG5cbmV4cG9ydCBjbGFzcyBNaWRkbGV3YXJlU3RhY2s8XG4gIElucHV0IGV4dGVuZHMgb2JqZWN0LFxuICBPdXRwdXQgZXh0ZW5kcyBvYmplY3QsXG4gIFN0cmVhbSA9IFVpbnQ4QXJyYXlcbj4ge1xuICBwcml2YXRlIHJlYWRvbmx5IGVudHJpZXM6IEFycmF5PEhhbmRsZXJMaXN0RW50cnk8SW5wdXQsIE91dHB1dCwgU3RyZWFtPj4gPSBbXTtcbiAgcHJpdmF0ZSBzb3J0ZWQ6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIGFkZChcbiAgICBtaWRkbGV3YXJlOiBNaWRkbGV3YXJlPElucHV0LCBPdXRwdXQ+LFxuICAgIG9wdGlvbnM/OiBIYW5kbGVyT3B0aW9ucyAmIHsgc3RlcD86IFwiaW5pdGlhbGl6ZVwiIH1cbiAgKTogdm9pZDtcblxuICBhZGQoXG4gICAgbWlkZGxld2FyZTogTWlkZGxld2FyZTxJbnB1dCwgT3V0cHV0PixcbiAgICBvcHRpb25zOiBTZXJpYWxpemVIYW5kbGVyT3B0aW9uc1xuICApOiB2b2lkO1xuXG4gIGFkZChcbiAgICBtaWRkbGV3YXJlOiBGaW5hbGl6ZU1pZGRsZXdhcmU8SW5wdXQsIE91dHB1dCwgU3RyZWFtPixcbiAgICBvcHRpb25zOiBCdWlsZEhhbmRsZXJPcHRpb25zXG4gICk6IHZvaWQ7XG5cbiAgYWRkKFxuICAgIG1pZGRsZXdhcmU6IEZpbmFsaXplTWlkZGxld2FyZTxJbnB1dCwgT3V0cHV0LCBTdHJlYW0+LFxuICAgIG9wdGlvbnM6IEZpbmFsaXplSGFuZGxlck9wdGlvbnNcbiAgKTogdm9pZDtcblxuICBhZGQoXG4gICAgbWlkZGxld2FyZTogTWlkZGxld2FyZTxJbnB1dCwgT3V0cHV0PixcbiAgICBvcHRpb25zOiBIYW5kbGVyT3B0aW9ucyA9IHt9XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHsgc3RlcCA9IFwiaW5pdGlhbGl6ZVwiLCBwcmlvcml0eSA9IDAsIHRhZ3MgfSA9IG9wdGlvbnM7XG4gICAgdGhpcy5zb3J0ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmVudHJpZXMucHVzaCh7XG4gICAgICBtaWRkbGV3YXJlLFxuICAgICAgcHJpb3JpdHksXG4gICAgICBzdGVwLFxuICAgICAgdGFnc1xuICAgIH0pO1xuICB9XG5cbiAgY2xvbmUoKTogSU1pZGRsZXdhcmVTdGFjazxJbnB1dCwgT3V0cHV0LCBTdHJlYW0+IHtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyBNaWRkbGV3YXJlU3RhY2s8SW5wdXQsIE91dHB1dCwgU3RyZWFtPigpO1xuICAgIGNsb25lLmVudHJpZXMucHVzaCguLi50aGlzLmVudHJpZXMpO1xuICAgIGNsb25lLnNvcnRlZCA9IHRoaXMuc29ydGVkO1xuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuXG4gIGNvbmNhdDxJbnB1dFR5cGUgZXh0ZW5kcyBJbnB1dCwgT3V0cHV0VHlwZSBleHRlbmRzIE91dHB1dD4oXG4gICAgZnJvbTogTWlkZGxld2FyZVN0YWNrPElucHV0VHlwZSwgT3V0cHV0VHlwZSwgU3RyZWFtPlxuICApOiBNaWRkbGV3YXJlU3RhY2s8SW5wdXRUeXBlLCBPdXRwdXRUeXBlLCBTdHJlYW0+IHtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyBNaWRkbGV3YXJlU3RhY2s8SW5wdXRUeXBlLCBPdXRwdXRUeXBlLCBTdHJlYW0+KCk7XG4gICAgY2xvbmUuZW50cmllcy5wdXNoKC4uLih0aGlzLmVudHJpZXMgYXMgYW55KSwgLi4uZnJvbS5lbnRyaWVzKTtcbiAgICBjbG9uZS5zb3J0ZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICByZW1vdmUodG9SZW1vdmU6IE1pZGRsZXdhcmU8SW5wdXQsIE91dHB1dD4gfCBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCB7IGxlbmd0aCB9ID0gdGhpcy5lbnRyaWVzO1xuICAgIGlmICh0eXBlb2YgdG9SZW1vdmUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHRoaXMucmVtb3ZlQnlUYWcodG9SZW1vdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlbW92ZUJ5SWRlbnRpdHkodG9SZW1vdmUpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmVudHJpZXMubGVuZ3RoIDwgbGVuZ3RoO1xuICB9XG5cbiAgZmlsdGVyKFxuICAgIGNhbGxiYWNrZm46IChoYW5kbGVyT3B0aW9uczogSGFuZGxlck9wdGlvbnMpID0+IGJvb2xlYW5cbiAgKTogTWlkZGxld2FyZVN0YWNrPElucHV0LCBPdXRwdXQsIFN0cmVhbT4ge1xuICAgIGNvbnN0IGZpbHRlcmVkID0gbmV3IE1pZGRsZXdhcmVTdGFjazxJbnB1dCwgT3V0cHV0LCBTdHJlYW0+KCk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiB0aGlzLmVudHJpZXMpIHtcbiAgICAgIGNvbnN0IG9wdGlvbnM6IEhhbmRsZXJPcHRpb25zID0ge1xuICAgICAgICBzdGVwOiBlbnRyeS5zdGVwLFxuICAgICAgICBwcmlvcml0eTogZW50cnkucHJpb3JpdHksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi5lbnRyeS50YWdzXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBpZiAoY2FsbGJhY2tmbihvcHRpb25zKSkge1xuICAgICAgICBmaWx0ZXJlZC5lbnRyaWVzLnB1c2goZW50cnkpO1xuICAgICAgfVxuICAgIH1cbiAgICBmaWx0ZXJlZC5zb3J0ZWQgPSB0aGlzLnNvcnRlZDtcbiAgICByZXR1cm4gZmlsdGVyZWQ7XG4gIH1cblxuICByZXNvbHZlPElucHV0VHlwZSBleHRlbmRzIElucHV0LCBPdXRwdXRUeXBlIGV4dGVuZHMgT3V0cHV0PihcbiAgICBoYW5kbGVyOiBGaW5hbGl6ZUhhbmRsZXI8SW5wdXRUeXBlLCBPdXRwdXRUeXBlLCBTdHJlYW0+LFxuICAgIGNvbnRleHQ6IEhhbmRsZXJFeGVjdXRpb25Db250ZXh0XG4gICk6IEhhbmRsZXI8SW5wdXRUeXBlLCBPdXRwdXRUeXBlPiB7XG4gICAgaWYgKCF0aGlzLnNvcnRlZCkge1xuICAgICAgdGhpcy5zb3J0KCk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCB7IG1pZGRsZXdhcmUgfSBvZiB0aGlzLmVudHJpZXMpIHtcbiAgICAgIGhhbmRsZXIgPSBtaWRkbGV3YXJlKFxuICAgICAgICBoYW5kbGVyIGFzIEhhbmRsZXI8SW5wdXQsIE91dHB1dFR5cGU+LFxuICAgICAgICBjb250ZXh0XG4gICAgICApIGFzIGFueTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGFuZGxlciBhcyBIYW5kbGVyPElucHV0VHlwZSwgT3V0cHV0VHlwZT47XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZUJ5SWRlbnRpdHkodG9SZW1vdmU6IE1pZGRsZXdhcmU8SW5wdXQsIE91dHB1dD4pIHtcbiAgICBmb3IgKGxldCBpID0gdGhpcy5lbnRyaWVzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAodGhpcy5lbnRyaWVzW2ldLm1pZGRsZXdhcmUgPT09IHRvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuZW50cmllcy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSByZW1vdmVCeVRhZyh0b1JlbW92ZTogc3RyaW5nKSB7XG4gICAgZm9yIChsZXQgaSA9IHRoaXMuZW50cmllcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgY29uc3QgeyB0YWdzIH0gPSB0aGlzLmVudHJpZXNbaV07XG4gICAgICBpZiAodGFncyAmJiB0b1JlbW92ZSBpbiB0YWdzKSB7XG4gICAgICAgIHRoaXMuZW50cmllcy5zcGxpY2UoaSwgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzb3J0KCk6IHZvaWQge1xuICAgIHRoaXMuZW50cmllcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICBjb25zdCBzdGVwV2VpZ2h0ID0gc3RlcFdlaWdodHNbYS5zdGVwXSAtIHN0ZXBXZWlnaHRzW2Iuc3RlcF07XG4gICAgICByZXR1cm4gc3RlcFdlaWdodCB8fCBhLnByaW9yaXR5IC0gYi5wcmlvcml0eTtcbiAgICB9KTtcbiAgICB0aGlzLnNvcnRlZCA9IHRydWU7XG4gIH1cbn1cblxuY29uc3Qgc3RlcFdlaWdodHMgPSB7XG4gIGluaXRpYWxpemU6IDQsXG4gIHNlcmlhbGl6ZTogMyxcbiAgYnVpbGQ6IDIsXG4gIGZpbmFsaXplOiAxXG59O1xuIl19

/***/ }),

/***/ 17937:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(35034), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 35034:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var https = __webpack_require__(57211);
var http = __webpack_require__(98605);
var querystring_builder_1 = __webpack_require__(72845);
var set_connection_timeout_1 = __webpack_require__(19281);
var set_socket_timeout_1 = __webpack_require__(38142);
var write_request_body_1 = __webpack_require__(96053);
var NodeHttpHandler = /** @class */ (function () {
    function NodeHttpHandler(httpOptions) {
        if (httpOptions === void 0) { httpOptions = {}; }
        this.httpOptions = httpOptions;
        var keepAlive = httpOptions.keepAlive;
        this.httpAgent = new http.Agent({ keepAlive: keepAlive });
        this.httpsAgent = new https.Agent({ keepAlive: keepAlive });
    }
    NodeHttpHandler.prototype.destroy = function () {
        this.httpAgent.destroy();
        this.httpsAgent.destroy();
    };
    NodeHttpHandler.prototype.handle = function (request, options) {
        var _this = this;
        // determine which http(s) client to use
        var isSSL = request.protocol === "https:";
        var httpClient = isSSL ? https : http;
        var path = request.path;
        if (request.query) {
            var queryString = querystring_builder_1.buildQueryString(request.query);
            if (queryString) {
                path += "?" + queryString;
            }
        }
        var nodeHttpsOptions = {
            headers: request.headers,
            host: request.hostname,
            method: request.method,
            path: path,
            port: request.port,
            agent: isSSL ? this.httpsAgent : this.httpAgent
        };
        return new Promise(function (resolve, reject) {
            var abortSignal = options && options.abortSignal;
            var _a = _this.httpOptions, connectionTimeout = _a.connectionTimeout, socketTimeout = _a.socketTimeout;
            // if the request was already aborted, prevent doing extra work
            if (abortSignal && abortSignal.aborted) {
                var abortError = new Error("Request aborted");
                abortError.name = "AbortError";
                reject(abortError);
                return;
            }
            // create the http request
            var req = httpClient.request(nodeHttpsOptions, function (res) {
                var e_1, _a;
                var httpHeaders = res.headers;
                var transformedHeaders = {};
                try {
                    for (var _b = tslib_1.__values(Object.keys(httpHeaders)), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var name = _c.value;
                        var headerValues = httpHeaders[name];
                        transformedHeaders[name] = Array.isArray(headerValues)
                            ? headerValues.join(",")
                            : headerValues;
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                var httpResponse = {
                    statusCode: res.statusCode || -1,
                    headers: transformedHeaders,
                    body: res
                };
                resolve(httpResponse);
            });
            req.on("error", reject);
            // wire-up any timeout logic
            set_connection_timeout_1.setConnectionTimeout(req, reject, connectionTimeout);
            set_socket_timeout_1.setSocketTimeout(req, reject, socketTimeout);
            // wire-up abort logic
            if (abortSignal) {
                abortSignal.onabort = function () {
                    // ensure request is destroyed
                    req.abort();
                    var abortError = new Error("Request aborted");
                    abortError.name = "AbortError";
                    reject(abortError);
                };
            }
            write_request_body_1.writeRequestBody(req, request);
        });
    };
    return NodeHttpHandler;
}());
exports.NodeHttpHandler = NodeHttpHandler;
//# sourceMappingURL=node-http-handler.js.map

/***/ }),

/***/ 19281:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function setConnectionTimeout(request, reject, timeoutInMs) {
    if (timeoutInMs === void 0) { timeoutInMs = 0; }
    if (!timeoutInMs) {
        return;
    }
    request.on("socket", function (socket) {
        var _this = this;
        if (socket.connecting) {
            // Throw a connecting timeout error unless a connection is made within x time
            var timeoutId_1 = setTimeout(function () {
                // abort the request to destroy it
                _this.abort();
                var timeoutError = new Error("Socket timed out without establishing a connection within " + timeoutInMs + " ms");
                timeoutError.name = "TimeoutError";
                reject(timeoutError);
            }, timeoutInMs);
            // if the connection was established, cancel the timeout
            socket.on("connect", function () {
                clearTimeout(timeoutId_1);
            });
        }
    });
}
exports.setConnectionTimeout = setConnectionTimeout;
//# sourceMappingURL=set-connection-timeout.js.map

/***/ }),

/***/ 38142:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function setSocketTimeout(request, reject, timeoutInMs) {
    if (timeoutInMs === void 0) { timeoutInMs = 0; }
    request.setTimeout(timeoutInMs, function () {
        // abort the request to destroy it
        this.abort();
        var timeoutError = new Error("Connection timed out after " + timeoutInMs + " ms");
        timeoutError.name = "TimeoutError";
        reject(timeoutError);
    });
}
exports.setSocketTimeout = setSocketTimeout;
//# sourceMappingURL=set-socket-timeout.js.map

/***/ }),

/***/ 96053:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var stream_1 = __webpack_require__(92413);
function writeRequestBody(httpRequest, request) {
    var expect = request.headers["Expect"] || request.headers["expect"];
    if (expect === "100-continue") {
        httpRequest.on("continue", function () {
            writeBody(httpRequest, request.body);
        });
    }
    else {
        writeBody(httpRequest, request.body);
    }
}
exports.writeRequestBody = writeRequestBody;
function writeBody(httpRequest, body) {
    if (body instanceof stream_1.Readable) {
        // pipe automatically handles end
        body.pipe(httpRequest);
    }
    else if (body) {
        httpRequest.end(body);
    }
    else {
        httpRequest.end();
    }
}
//# sourceMappingURL=write-request-body.js.map

/***/ }),

/***/ 55809:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
/**
 * An error representing a failure of an individual credential provider.
 *
 * This error class has special meaning to the {@link chain} method. If a
 * provider in the chain is rejected with an error, the chain will only proceed
 * to the next provider if the value of the `tryNextLink` property on the error
 * is truthy. This allows individual providers to halt the chain and also
 * ensures the chain will stop if an entirely unexpected error is encountered.
 */
var ProviderError = /** @class */ (function (_super) {
    tslib_1.__extends(ProviderError, _super);
    function ProviderError(message, tryNextLink) {
        if (tryNextLink === void 0) { tryNextLink = true; }
        var _this = _super.call(this, message) || this;
        _this.tryNextLink = tryNextLink;
        return _this;
    }
    return ProviderError;
}(Error));
exports.ProviderError = ProviderError;
//# sourceMappingURL=ProviderError.js.map

/***/ }),

/***/ 36364:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var ProviderError_1 = __webpack_require__(55809);
/**
 * Compose a single credential provider function from multiple credential
 * providers. The first provider in the argument list will always be invoked;
 * subsequent providers in the list will be invoked in the order in which the
 * were received if the preceding provider did not successfully resolve.
 *
 * If no providers were received or no provider resolves successfully, the
 * returned promise will be rejected.
 */
function chain() {
    var providers = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        providers[_i] = arguments[_i];
    }
    return function () {
        var e_1, _a;
        var promise = Promise.reject(new ProviderError_1.ProviderError("No providers in chain"));
        var _loop_1 = function (provider) {
            promise = promise.catch(function (err) {
                if (err && err.tryNextLink) {
                    return provider();
                }
                throw err;
            });
        };
        try {
            for (var providers_1 = tslib_1.__values(providers), providers_1_1 = providers_1.next(); !providers_1_1.done; providers_1_1 = providers_1.next()) {
                var provider = providers_1_1.value;
                _loop_1(provider);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (providers_1_1 && !providers_1_1.done && (_a = providers_1.return)) _a.call(providers_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return promise;
    };
}
exports.chain = chain;
//# sourceMappingURL=chain.js.map

/***/ }),

/***/ 90215:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function fromStatic(staticValue) {
    var promisified = Promise.resolve(staticValue);
    return function () { return promisified; };
}
exports.fromStatic = fromStatic;
//# sourceMappingURL=fromStatic.js.map

/***/ }),

/***/ 36772:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(36364), exports);
tslib_1.__exportStar(__webpack_require__(90215), exports);
tslib_1.__exportStar(__webpack_require__(64894), exports);
tslib_1.__exportStar(__webpack_require__(55809), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 64894:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function memoize(provider, isExpired, requiresRefresh) {
    if (isExpired === undefined) {
        // This is a static memoization; no need to incorporate refreshing
        var result_1 = provider();
        return function () { return result_1; };
    }
    var result = provider();
    var isConstant = false;
    return function () {
        if (isConstant) {
            return result;
        }
        return result.then(function (resolved) {
            if (requiresRefresh && !requiresRefresh(resolved)) {
                isConstant = true;
                return resolved;
            }
            if (isExpired(resolved)) {
                return (result = provider());
            }
            return resolved;
        });
    };
}
exports.memoize = memoize;
//# sourceMappingURL=memoize.js.map

/***/ }),

/***/ 78691:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var is_array_buffer_1 = __webpack_require__(47749);
var protocol_timestamp_1 = __webpack_require__(27949);
var response_metadata_extractor_1 = __webpack_require__(48881);
var RestParser = /** @class */ (function () {
    function RestParser(bodyParser, bodyCollector, parseServiceException, utf8Encoder, base64Decoder) {
        this.bodyParser = bodyParser;
        this.bodyCollector = bodyCollector;
        this.parseServiceException = parseServiceException;
        this.utf8Encoder = utf8Encoder;
        this.base64Decoder = base64Decoder;
    }
    RestParser.prototype.parse = function (operation, input) {
        var _this = this;
        var output = {};
        var responseHeaders = input.headers;
        output.$metadata = response_metadata_extractor_1.extractMetadata(input);
        if (this.responseIsSuccessful(input.statusCode)) {
            this.parseHeaders(output, responseHeaders, operation.output);
            this.parseStatusCode(output, input.statusCode, operation.output);
            return this.parseBody(output, operation.output, input);
        }
        else {
            return this.resolveBodyString(input.body).then(function (body) {
                throw _this.parseServiceException(operation, tslib_1.__assign({}, input, { body: body }), _this.bodyParser);
            });
        }
    };
    RestParser.prototype.parseBody = function (output, member, response) {
        var _this = this;
        // determine if the member references a payload member
        var shape = member.shape;
        var body = response.body;
        var payloadName = shape.payload;
        if (payloadName) {
            var payloadMember_1 = shape.members[payloadName];
            var payloadShape_1 = payloadMember_1.shape;
            if (payloadShape_1.type === "blob") {
                if (payloadMember_1.streaming || payloadShape_1.streaming) {
                    output[payloadName] = body;
                    return Promise.resolve(output);
                }
                // non-streaming blobs should always be byte arrays
                return this.resolveBody(body).then(function (buffer) {
                    output[payloadName] = buffer;
                    return output;
                });
            }
            else {
                return this.resolveBodyString(body).then(function (body) {
                    if (payloadShape_1.type === "structure" ||
                        payloadShape_1.type === "list" ||
                        payloadShape_1.type === "map") {
                        output[payloadName] = _this.bodyParser.parse(payloadMember_1, body);
                    }
                    else {
                        output[payloadName] = _this.parseScalarBody(payloadShape_1, body);
                    }
                    return output;
                });
            }
        }
        else {
            return this.resolveBodyString(body).then(function (body) {
                var e_1, _a;
                if (body.length > 0) {
                    var parsedBody = _this.bodyParser.parse(member, body);
                    try {
                        for (var _b = tslib_1.__values(Object.keys(parsedBody)), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var key = _c.value;
                            output[key] = parsedBody[key];
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                return Promise.resolve(output);
            });
        }
    };
    RestParser.prototype.parseHeaders = function (output, inputHeaders, member) {
        var e_2, _a, e_3, _b, e_4, _c;
        if (member.shape.type !== "structure") {
            return;
        }
        var lowerInputHeaders = {};
        try {
            // transform response headers into lowercase for easier comparisons
            for (var _d = tslib_1.__values(Object.keys(inputHeaders)), _e = _d.next(); !_e.done; _e = _d.next()) {
                var header = _e.value;
                lowerInputHeaders[header.toLowerCase()] = inputHeaders[header];
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_e && !_e.done && (_a = _d.return)) _a.call(_d);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var members = member.shape.members;
        try {
            for (var _f = tslib_1.__values(Object.keys(members)), _g = _f.next(); !_g.done; _g = _f.next()) {
                var memberName = _g.value;
                var member_1 = members[memberName];
                var location = member_1.location, _h = member_1.locationName, locationName = _h === void 0 ? memberName : _h, memberShape = member_1.shape;
                var hasLocationName = Boolean(member_1.locationName);
                if (location !== "header" && location !== "headers") {
                    continue;
                }
                var ruleHeaderName = locationName.toLowerCase();
                var inputHeaderValue = lowerInputHeaders[ruleHeaderName];
                if (memberShape.type === "map") {
                    output[memberName] = {};
                    var regex = new RegExp("^" + locationName + "(.+)", "i");
                    try {
                        // iterate over each header
                        for (var _j = tslib_1.__values(Object.keys(inputHeaders)), _k = _j.next(); !_k.done; _k = _j.next()) {
                            var header = _k.value;
                            var result = header.match(regex);
                            if (result) {
                                output[memberName][result[1]] = inputHeaders[header];
                            }
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_k && !_k.done && (_c = _j.return)) _c.call(_j);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
                else {
                    if (typeof inputHeaderValue !== "undefined") {
                        output[memberName] = this.parseScalarHeader(memberShape, inputHeaderValue);
                    }
                }
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_b = _f.return)) _b.call(_f);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    RestParser.prototype.parseScalarBody = function (shape, input) {
        switch (shape.type) {
            case "timestamp":
                return protocol_timestamp_1.toDate(input);
            case "string":
                if (typeof input === "string") {
                    return input;
                }
                else {
                    return this.utf8Encoder(input);
                }
            case "boolean":
                return typeof input === "boolean" ? input : input === "true";
            case "integer":
                return parseInt(input, 10);
            case "float":
                return parseFloat(input);
        }
    };
    RestParser.prototype.parseScalarHeader = function (shape, input) {
        switch (shape.type) {
            case "timestamp":
                return protocol_timestamp_1.toDate(input);
            case "string":
                return shape.jsonValue
                    ? JSON.parse(this.utf8Encoder(this.base64Decoder(input)))
                    : input;
            case "boolean":
                return input === "true";
            case "integer":
                return parseInt(input, 10);
            case "float":
                return parseFloat(input);
            case "blob":
                return this.base64Decoder(input);
        }
    };
    RestParser.prototype.parseStatusCode = function (output, statusCode, member) {
        var e_5, _a;
        if (!statusCode) {
            return;
        }
        var shape = member.shape;
        var members = shape.members;
        try {
            for (var _b = tslib_1.__values(Object.keys(members)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var memberName = _c.value;
                var member_2 = members[memberName];
                if (member_2.location === "statusCode") {
                    var name = member_2.locationName || memberName;
                    output[name] = statusCode;
                    return;
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_5) throw e_5.error; }
        }
    };
    RestParser.prototype.resolveBody = function (body) {
        if (body === void 0) { body = ""; }
        if (typeof body === "string") {
            return Promise.resolve(body);
        }
        var bufferPromise;
        if (ArrayBuffer.isView(body)) {
            bufferPromise = Promise.resolve(new Uint8Array(body.buffer, body.byteOffset, body.byteLength));
        }
        else if (is_array_buffer_1.isArrayBuffer(body)) {
            bufferPromise = Promise.resolve(new Uint8Array(body, 0, body.byteLength));
        }
        else {
            bufferPromise = this.bodyCollector(body);
        }
        return bufferPromise;
    };
    RestParser.prototype.resolveBodyString = function (body) {
        var _this = this;
        if (body === void 0) { body = ""; }
        return this.resolveBody(body).then(function (buffer) {
            return typeof buffer === "string" ? buffer : _this.utf8Encoder(buffer);
        });
    };
    RestParser.prototype.responseIsSuccessful = function (statusCode) {
        return statusCode < 300;
    };
    return RestParser;
}());
exports.RestParser = RestParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzdFBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9SZXN0UGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDREQUF5RDtBQUN6RCxrRUFBcUQ7QUFDckQsb0ZBQXVFO0FBa0J2RTtJQUNFLG9CQUNtQixVQUFzQixFQUN0QixhQUEwQyxFQUMxQyxxQkFBNkMsRUFDN0MsV0FBb0IsRUFDcEIsYUFBc0I7UUFKdEIsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUN0QixrQkFBYSxHQUFiLGFBQWEsQ0FBNkI7UUFDMUMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUF3QjtRQUM3QyxnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUNwQixrQkFBYSxHQUFiLGFBQWEsQ0FBUztJQUN0QyxDQUFDO0lBRUcsMEJBQUssR0FBWixVQUNFLFNBQXlCLEVBQ3pCLEtBQStCO1FBRmpDLGlCQXNCQztRQWxCQyxJQUFNLE1BQU0sR0FBd0IsRUFBRSxDQUFDO1FBQy9CLElBQUEsK0JBQXdCLENBQVc7UUFDM0MsTUFBTSxDQUFDLFNBQVMsR0FBRyw2Q0FBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUMvQyxJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxlQUFlLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ2pFLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBRXBELENBQUM7U0FDSDthQUFNO1lBQ0wsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUk7Z0JBQ2pELE1BQU0sS0FBSSxDQUFDLHFCQUFxQixDQUM5QixTQUFTLHVCQUNKLEtBQUssSUFBRSxJQUFJLE1BQUEsS0FDaEIsS0FBSSxDQUFDLFVBQVUsQ0FDaEIsQ0FBQztZQUNKLENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0lBRU8sOEJBQVMsR0FBakIsVUFDRSxNQUFXLEVBQ1gsTUFBYyxFQUNkLFFBQWtDO1FBSHBDLGlCQW1EQztRQTlDQyxzREFBc0Q7UUFDdEQsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQWtCLENBQUM7UUFFeEMsSUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztRQUUzQixJQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDO1FBRWxDLElBQUksV0FBVyxFQUFFO1lBQ2YsSUFBTSxlQUFhLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNqRCxJQUFNLGNBQVksR0FBRyxlQUFhLENBQUMsS0FBSyxDQUFDO1lBRXpDLElBQUksY0FBWSxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7Z0JBQ2hDLElBQUksZUFBYSxDQUFDLFNBQVMsSUFBSSxjQUFZLENBQUMsU0FBUyxFQUFFO29CQUNyRCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUMzQixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQ2hDO2dCQUNELG1EQUFtRDtnQkFDbkQsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU07b0JBQ3ZDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxNQUFNLENBQUM7b0JBQzdCLE9BQU8sTUFBTSxDQUFDO2dCQUNoQixDQUFDLENBQUMsQ0FBQzthQUNKO2lCQUFNO2dCQUNMLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUk7b0JBQzNDLElBQ0UsY0FBWSxDQUFDLElBQUksS0FBSyxXQUFXO3dCQUNqQyxjQUFZLENBQUMsSUFBSSxLQUFLLE1BQU07d0JBQzVCLGNBQVksQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUMzQjt3QkFDQSxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsZUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO3FCQUNsRTt5QkFBTTt3QkFDTCxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSSxDQUFDLGVBQWUsQ0FBQyxjQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7cUJBQ2hFO29CQUNELE9BQU8sTUFBTSxDQUFDO2dCQUNoQixDQUFDLENBQUMsQ0FBQzthQUNKO1NBQ0Y7YUFBTTtZQUNMLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUk7O2dCQUMzQyxJQUFJLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUNuQixJQUFNLFVBQVUsR0FBUSxLQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7O3dCQUM1RCxLQUFnQixJQUFBLEtBQUEsaUJBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQSxnQkFBQSw0QkFBRTs0QkFBcEMsSUFBSSxHQUFHLFdBQUE7NEJBQ1YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQzt5QkFDL0I7Ozs7Ozs7OztpQkFDRjtnQkFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7SUFFTyxpQ0FBWSxHQUFwQixVQUNFLE1BQVcsRUFDWCxZQUF1QixFQUN2QixNQUFjOztRQUVkLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFO1lBQ3JDLE9BQU87U0FDUjtRQUNELElBQU0saUJBQWlCLEdBQWMsRUFBRSxDQUFDOztZQUV4QyxtRUFBbUU7WUFDbkUsS0FBbUIsSUFBQSxLQUFBLGlCQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUEsZ0JBQUEsNEJBQUU7Z0JBQXpDLElBQUksTUFBTSxXQUFBO2dCQUNiLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUNoRTs7Ozs7Ozs7O1FBRUQsSUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7O1lBRXJDLEtBQXVCLElBQUEsS0FBQSxpQkFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBLGdCQUFBLDRCQUFFO2dCQUF4QyxJQUFJLFVBQVUsV0FBQTtnQkFDakIsSUFBSSxRQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMzQixJQUFBLDRCQUFRLEVBQUUsMEJBQXlCLEVBQXpCLDhDQUF5QixFQUFFLDRCQUFrQixDQUFZO2dCQUN6RSxJQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsUUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUVyRCxJQUFJLFFBQVEsS0FBSyxRQUFRLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtvQkFDbkQsU0FBUztpQkFDVjtnQkFDRCxJQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2xELElBQU0sZ0JBQWdCLEdBQUcsaUJBQWlCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBRTNELElBQUksV0FBVyxDQUFDLElBQUksS0FBSyxLQUFLLEVBQUU7b0JBQzlCLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUM7b0JBQ3hCLElBQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLE1BQUksWUFBWSxTQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7O3dCQUN0RCwyQkFBMkI7d0JBQzNCLEtBQW1CLElBQUEsS0FBQSxpQkFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBLGdCQUFBLDRCQUFFOzRCQUF6QyxJQUFJLE1BQU0sV0FBQTs0QkFDYixJQUFJLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDOzRCQUNqQyxJQUFJLE1BQU0sRUFBRTtnQ0FDVixNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDOzZCQUN0RDt5QkFDRjs7Ozs7Ozs7O2lCQUNGO3FCQUFNO29CQUNMLElBQUksT0FBTyxnQkFBZ0IsS0FBSyxXQUFXLEVBQUU7d0JBQzNDLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQ3pDLFdBQVcsRUFDWCxnQkFBZ0IsQ0FDakIsQ0FBQztxQkFDSDtpQkFDRjthQUNGOzs7Ozs7Ozs7SUFDSCxDQUFDO0lBRU8sb0NBQWUsR0FBdkIsVUFBd0IsS0FBeUIsRUFBRSxLQUFVO1FBQzNELFFBQVEsS0FBSyxDQUFDLElBQUksRUFBRTtZQUNsQixLQUFLLFdBQVc7Z0JBQ2QsT0FBTywyQkFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLEtBQUssUUFBUTtnQkFDWCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtvQkFDN0IsT0FBTyxLQUFLLENBQUM7aUJBQ2Q7cUJBQU07b0JBQ0wsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNoQztZQUNILEtBQUssU0FBUztnQkFDWixPQUFPLE9BQU8sS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEtBQUssTUFBTSxDQUFDO1lBQy9ELEtBQUssU0FBUztnQkFDWixPQUFPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDN0IsS0FBSyxPQUFPO2dCQUNWLE9BQU8sVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzVCO0lBQ0gsQ0FBQztJQUVPLHNDQUFpQixHQUF6QixVQUEwQixLQUF5QixFQUFFLEtBQWE7UUFDaEUsUUFBUSxLQUFLLENBQUMsSUFBSSxFQUFFO1lBQ2xCLEtBQUssV0FBVztnQkFDZCxPQUFPLDJCQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkIsS0FBSyxRQUFRO2dCQUNYLE9BQU8sS0FBSyxDQUFDLFNBQVM7b0JBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO29CQUN6RCxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ1osS0FBSyxTQUFTO2dCQUNaLE9BQU8sS0FBSyxLQUFLLE1BQU0sQ0FBQztZQUMxQixLQUFLLFNBQVM7Z0JBQ1osT0FBTyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQzdCLEtBQUssT0FBTztnQkFDVixPQUFPLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixLQUFLLE1BQU07Z0JBQ1QsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BDO0lBQ0gsQ0FBQztJQUVPLG9DQUFlLEdBQXZCLFVBQ0UsTUFBVyxFQUNYLFVBQWtCLEVBQ2xCLE1BQWM7O1FBRWQsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLE9BQU87U0FDUjtRQUNELElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFrQixDQUFDO1FBQ3hDLElBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7O1lBRTlCLEtBQXVCLElBQUEsS0FBQSxpQkFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBLGdCQUFBLDRCQUFFO2dCQUF4QyxJQUFJLFVBQVUsV0FBQTtnQkFDakIsSUFBSSxRQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLFFBQU0sQ0FBQyxRQUFRLEtBQUssWUFBWSxFQUFFO29CQUNwQyxJQUFNLElBQUksR0FBRyxRQUFNLENBQUMsWUFBWSxJQUFJLFVBQVUsQ0FBQztvQkFDL0MsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQztvQkFDMUIsT0FBTztpQkFDUjthQUNGOzs7Ozs7Ozs7SUFDSCxDQUFDO0lBRU8sZ0NBQVcsR0FBbkIsVUFDRSxJQUEyQztRQUEzQyxxQkFBQSxFQUFBLFNBQTJDO1FBRTNDLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFFO1lBQzVCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM5QjtRQUVELElBQUksYUFBa0MsQ0FBQztRQUN2QyxJQUFJLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDNUIsYUFBYSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQzdCLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQzlELENBQUM7U0FDSDthQUFNLElBQUksK0JBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM5QixhQUFhLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQzNFO2FBQU07WUFDTCxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQztRQUVELE9BQU8sYUFBYSxDQUFDO0lBQ3ZCLENBQUM7SUFFTyxzQ0FBaUIsR0FBekIsVUFDRSxJQUEyQztRQUQ3QyxpQkFNQztRQUxDLHFCQUFBLEVBQUEsU0FBMkM7UUFFM0MsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU07WUFDdkMsT0FBQSxPQUFPLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFBOUQsQ0FBOEQsQ0FDL0QsQ0FBQztJQUNKLENBQUM7SUFFTyx5Q0FBb0IsR0FBNUIsVUFBNkIsVUFBa0I7UUFDN0MsT0FBTyxVQUFVLEdBQUcsR0FBRyxDQUFDO0lBQzFCLENBQUM7SUFDSCxpQkFBQztBQUFELENBQUMsQUFsT0QsSUFrT0M7QUFsT1ksZ0NBQVUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBpc0FycmF5QnVmZmVyIH0gZnJvbSBcIkBhd3Mtc2RrL2lzLWFycmF5LWJ1ZmZlclwiO1xuaW1wb3J0IHsgdG9EYXRlIH0gZnJvbSBcIkBhd3Mtc2RrL3Byb3RvY29sLXRpbWVzdGFtcFwiO1xuaW1wb3J0IHsgZXh0cmFjdE1ldGFkYXRhIH0gZnJvbSBcIkBhd3Mtc2RrL3Jlc3BvbnNlLW1ldGFkYXRhLWV4dHJhY3RvclwiO1xuaW1wb3J0IHsgaW5pdFNlcnZpY2VFeGNlcHRpb24gfSBmcm9tIFwiQGF3cy1zZGsvdXRpbC1lcnJvci1jb25zdHJ1Y3RvclwiO1xuaW1wb3J0IHtcbiAgQm9keVBhcnNlcixcbiAgRGVjb2RlcixcbiAgRW5jb2RlcixcbiAgSGVhZGVyQmFnLFxuICBIdHRwUmVzcG9uc2UsXG4gIE1lbWJlcixcbiAgTWV0YWRhdGFCZWFyZXIsXG4gIE9wZXJhdGlvbk1vZGVsLFxuICBSZXNwb25zZVBhcnNlcixcbiAgU2VyaWFsaXphdGlvbk1vZGVsLFxuICBTdHJlYW1Db2xsZWN0b3IsXG4gIFN0cnVjdHVyZSxcbiAgU2VydmljZUV4Y2VwdGlvblBhcnNlclxufSBmcm9tIFwiQGF3cy1zZGsvdHlwZXNcIjtcblxuZXhwb3J0IGNsYXNzIFJlc3RQYXJzZXI8U3RyZWFtVHlwZT4gaW1wbGVtZW50cyBSZXNwb25zZVBhcnNlcjxTdHJlYW1UeXBlPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYm9keVBhcnNlcjogQm9keVBhcnNlcixcbiAgICBwcml2YXRlIHJlYWRvbmx5IGJvZHlDb2xsZWN0b3I6IFN0cmVhbUNvbGxlY3RvcjxTdHJlYW1UeXBlPixcbiAgICBwcml2YXRlIHJlYWRvbmx5IHBhcnNlU2VydmljZUV4Y2VwdGlvbjogU2VydmljZUV4Y2VwdGlvblBhcnNlcixcbiAgICBwcml2YXRlIHJlYWRvbmx5IHV0ZjhFbmNvZGVyOiBFbmNvZGVyLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYmFzZTY0RGVjb2RlcjogRGVjb2RlclxuICApIHt9XG5cbiAgcHVibGljIHBhcnNlPE91dHB1dFR5cGUgZXh0ZW5kcyBNZXRhZGF0YUJlYXJlcj4oXG4gICAgb3BlcmF0aW9uOiBPcGVyYXRpb25Nb2RlbCxcbiAgICBpbnB1dDogSHR0cFJlc3BvbnNlPFN0cmVhbVR5cGU+XG4gICk6IFByb21pc2U8T3V0cHV0VHlwZT4ge1xuICAgIGNvbnN0IG91dHB1dDogUGFydGlhbDxPdXRwdXRUeXBlPiA9IHt9O1xuICAgIGNvbnN0IHsgaGVhZGVyczogcmVzcG9uc2VIZWFkZXJzIH0gPSBpbnB1dDtcbiAgICBvdXRwdXQuJG1ldGFkYXRhID0gZXh0cmFjdE1ldGFkYXRhKGlucHV0KTtcbiAgICBpZiAodGhpcy5yZXNwb25zZUlzU3VjY2Vzc2Z1bChpbnB1dC5zdGF0dXNDb2RlKSkge1xuICAgICAgdGhpcy5wYXJzZUhlYWRlcnMob3V0cHV0LCByZXNwb25zZUhlYWRlcnMsIG9wZXJhdGlvbi5vdXRwdXQpO1xuICAgICAgdGhpcy5wYXJzZVN0YXR1c0NvZGUob3V0cHV0LCBpbnB1dC5zdGF0dXNDb2RlLCBvcGVyYXRpb24ub3V0cHV0KTtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlQm9keShvdXRwdXQsIG9wZXJhdGlvbi5vdXRwdXQsIGlucHV0KSBhcyBQcm9taXNlPFxuICAgICAgICBPdXRwdXRUeXBlXG4gICAgICA+O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5yZXNvbHZlQm9keVN0cmluZyhpbnB1dC5ib2R5KS50aGVuKGJvZHkgPT4ge1xuICAgICAgICB0aHJvdyB0aGlzLnBhcnNlU2VydmljZUV4Y2VwdGlvbihcbiAgICAgICAgICBvcGVyYXRpb24sXG4gICAgICAgICAgeyAuLi5pbnB1dCwgYm9keSB9LFxuICAgICAgICAgIHRoaXMuYm9keVBhcnNlclxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZUJvZHkoXG4gICAgb3V0cHV0OiBhbnksXG4gICAgbWVtYmVyOiBNZW1iZXIsXG4gICAgcmVzcG9uc2U6IEh0dHBSZXNwb25zZTxTdHJlYW1UeXBlPlxuICApOiBQcm9taXNlPGFueT4ge1xuICAgIC8vIGRldGVybWluZSBpZiB0aGUgbWVtYmVyIHJlZmVyZW5jZXMgYSBwYXlsb2FkIG1lbWJlclxuICAgIGNvbnN0IHNoYXBlID0gbWVtYmVyLnNoYXBlIGFzIFN0cnVjdHVyZTtcblxuICAgIGNvbnN0IGJvZHkgPSByZXNwb25zZS5ib2R5O1xuXG4gICAgY29uc3QgcGF5bG9hZE5hbWUgPSBzaGFwZS5wYXlsb2FkO1xuXG4gICAgaWYgKHBheWxvYWROYW1lKSB7XG4gICAgICBjb25zdCBwYXlsb2FkTWVtYmVyID0gc2hhcGUubWVtYmVyc1twYXlsb2FkTmFtZV07XG4gICAgICBjb25zdCBwYXlsb2FkU2hhcGUgPSBwYXlsb2FkTWVtYmVyLnNoYXBlO1xuXG4gICAgICBpZiAocGF5bG9hZFNoYXBlLnR5cGUgPT09IFwiYmxvYlwiKSB7XG4gICAgICAgIGlmIChwYXlsb2FkTWVtYmVyLnN0cmVhbWluZyB8fCBwYXlsb2FkU2hhcGUuc3RyZWFtaW5nKSB7XG4gICAgICAgICAgb3V0cHV0W3BheWxvYWROYW1lXSA9IGJvZHk7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShvdXRwdXQpO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5vbi1zdHJlYW1pbmcgYmxvYnMgc2hvdWxkIGFsd2F5cyBiZSBieXRlIGFycmF5c1xuICAgICAgICByZXR1cm4gdGhpcy5yZXNvbHZlQm9keShib2R5KS50aGVuKGJ1ZmZlciA9PiB7XG4gICAgICAgICAgb3V0cHV0W3BheWxvYWROYW1lXSA9IGJ1ZmZlcjtcbiAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc29sdmVCb2R5U3RyaW5nKGJvZHkpLnRoZW4oYm9keSA9PiB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgcGF5bG9hZFNoYXBlLnR5cGUgPT09IFwic3RydWN0dXJlXCIgfHxcbiAgICAgICAgICAgIHBheWxvYWRTaGFwZS50eXBlID09PSBcImxpc3RcIiB8fFxuICAgICAgICAgICAgcGF5bG9hZFNoYXBlLnR5cGUgPT09IFwibWFwXCJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIG91dHB1dFtwYXlsb2FkTmFtZV0gPSB0aGlzLmJvZHlQYXJzZXIucGFyc2UocGF5bG9hZE1lbWJlciwgYm9keSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG91dHB1dFtwYXlsb2FkTmFtZV0gPSB0aGlzLnBhcnNlU2NhbGFyQm9keShwYXlsb2FkU2hhcGUsIGJvZHkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucmVzb2x2ZUJvZHlTdHJpbmcoYm9keSkudGhlbihib2R5ID0+IHtcbiAgICAgICAgaWYgKGJvZHkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZEJvZHk6IGFueSA9IHRoaXMuYm9keVBhcnNlci5wYXJzZShtZW1iZXIsIGJvZHkpO1xuICAgICAgICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhwYXJzZWRCb2R5KSkge1xuICAgICAgICAgICAgb3V0cHV0W2tleV0gPSBwYXJzZWRCb2R5W2tleV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUob3V0cHV0KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VIZWFkZXJzKFxuICAgIG91dHB1dDogYW55LFxuICAgIGlucHV0SGVhZGVyczogSGVhZGVyQmFnLFxuICAgIG1lbWJlcjogTWVtYmVyXG4gICk6IHZvaWQge1xuICAgIGlmIChtZW1iZXIuc2hhcGUudHlwZSAhPT0gXCJzdHJ1Y3R1cmVcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBsb3dlcklucHV0SGVhZGVyczogSGVhZGVyQmFnID0ge307XG5cbiAgICAvLyB0cmFuc2Zvcm0gcmVzcG9uc2UgaGVhZGVycyBpbnRvIGxvd2VyY2FzZSBmb3IgZWFzaWVyIGNvbXBhcmlzb25zXG4gICAgZm9yIChsZXQgaGVhZGVyIG9mIE9iamVjdC5rZXlzKGlucHV0SGVhZGVycykpIHtcbiAgICAgIGxvd2VySW5wdXRIZWFkZXJzW2hlYWRlci50b0xvd2VyQ2FzZSgpXSA9IGlucHV0SGVhZGVyc1toZWFkZXJdO1xuICAgIH1cblxuICAgIGNvbnN0IG1lbWJlcnMgPSBtZW1iZXIuc2hhcGUubWVtYmVycztcblxuICAgIGZvciAobGV0IG1lbWJlck5hbWUgb2YgT2JqZWN0LmtleXMobWVtYmVycykpIHtcbiAgICAgIGxldCBtZW1iZXIgPSBtZW1iZXJzW21lbWJlck5hbWVdO1xuICAgICAgbGV0IHsgbG9jYXRpb24sIGxvY2F0aW9uTmFtZSA9IG1lbWJlck5hbWUsIHNoYXBlOiBtZW1iZXJTaGFwZSB9ID0gbWVtYmVyO1xuICAgICAgY29uc3QgaGFzTG9jYXRpb25OYW1lID0gQm9vbGVhbihtZW1iZXIubG9jYXRpb25OYW1lKTtcblxuICAgICAgaWYgKGxvY2F0aW9uICE9PSBcImhlYWRlclwiICYmIGxvY2F0aW9uICE9PSBcImhlYWRlcnNcIikge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJ1bGVIZWFkZXJOYW1lID0gbG9jYXRpb25OYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCBpbnB1dEhlYWRlclZhbHVlID0gbG93ZXJJbnB1dEhlYWRlcnNbcnVsZUhlYWRlck5hbWVdO1xuXG4gICAgICBpZiAobWVtYmVyU2hhcGUudHlwZSA9PT0gXCJtYXBcIikge1xuICAgICAgICBvdXRwdXRbbWVtYmVyTmFtZV0gPSB7fTtcbiAgICAgICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBeJHtsb2NhdGlvbk5hbWV9KC4rKWAsIFwiaVwiKTtcbiAgICAgICAgLy8gaXRlcmF0ZSBvdmVyIGVhY2ggaGVhZGVyXG4gICAgICAgIGZvciAobGV0IGhlYWRlciBvZiBPYmplY3Qua2V5cyhpbnB1dEhlYWRlcnMpKSB7XG4gICAgICAgICAgbGV0IHJlc3VsdCA9IGhlYWRlci5tYXRjaChyZWdleCk7XG4gICAgICAgICAgaWYgKHJlc3VsdCkge1xuICAgICAgICAgICAgb3V0cHV0W21lbWJlck5hbWVdW3Jlc3VsdFsxXV0gPSBpbnB1dEhlYWRlcnNbaGVhZGVyXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgaW5wdXRIZWFkZXJWYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIG91dHB1dFttZW1iZXJOYW1lXSA9IHRoaXMucGFyc2VTY2FsYXJIZWFkZXIoXG4gICAgICAgICAgICBtZW1iZXJTaGFwZSxcbiAgICAgICAgICAgIGlucHV0SGVhZGVyVmFsdWVcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVNjYWxhckJvZHkoc2hhcGU6IFNlcmlhbGl6YXRpb25Nb2RlbCwgaW5wdXQ6IGFueSkge1xuICAgIHN3aXRjaCAoc2hhcGUudHlwZSkge1xuICAgICAgY2FzZSBcInRpbWVzdGFtcFwiOlxuICAgICAgICByZXR1cm4gdG9EYXRlKGlucHV0KTtcbiAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgaWYgKHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy51dGY4RW5jb2RlcihpbnB1dCk7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgIHJldHVybiB0eXBlb2YgaW5wdXQgPT09IFwiYm9vbGVhblwiID8gaW5wdXQgOiBpbnB1dCA9PT0gXCJ0cnVlXCI7XG4gICAgICBjYXNlIFwiaW50ZWdlclwiOlxuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICAgIGNhc2UgXCJmbG9hdFwiOlxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChpbnB1dCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwYXJzZVNjYWxhckhlYWRlcihzaGFwZTogU2VyaWFsaXphdGlvbk1vZGVsLCBpbnB1dDogc3RyaW5nKSB7XG4gICAgc3dpdGNoIChzaGFwZS50eXBlKSB7XG4gICAgICBjYXNlIFwidGltZXN0YW1wXCI6XG4gICAgICAgIHJldHVybiB0b0RhdGUoaW5wdXQpO1xuICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICByZXR1cm4gc2hhcGUuanNvblZhbHVlXG4gICAgICAgICAgPyBKU09OLnBhcnNlKHRoaXMudXRmOEVuY29kZXIodGhpcy5iYXNlNjREZWNvZGVyKGlucHV0KSkpXG4gICAgICAgICAgOiBpbnB1dDtcbiAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgIHJldHVybiBpbnB1dCA9PT0gXCJ0cnVlXCI7XG4gICAgICBjYXNlIFwiaW50ZWdlclwiOlxuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICAgIGNhc2UgXCJmbG9hdFwiOlxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChpbnB1dCk7XG4gICAgICBjYXNlIFwiYmxvYlwiOlxuICAgICAgICByZXR1cm4gdGhpcy5iYXNlNjREZWNvZGVyKGlucHV0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhcnNlU3RhdHVzQ29kZShcbiAgICBvdXRwdXQ6IGFueSxcbiAgICBzdGF0dXNDb2RlOiBudW1iZXIsXG4gICAgbWVtYmVyOiBNZW1iZXJcbiAgKTogdm9pZCB7XG4gICAgaWYgKCFzdGF0dXNDb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IHNoYXBlID0gbWVtYmVyLnNoYXBlIGFzIFN0cnVjdHVyZTtcbiAgICBjb25zdCBtZW1iZXJzID0gc2hhcGUubWVtYmVycztcblxuICAgIGZvciAobGV0IG1lbWJlck5hbWUgb2YgT2JqZWN0LmtleXMobWVtYmVycykpIHtcbiAgICAgIGxldCBtZW1iZXIgPSBtZW1iZXJzW21lbWJlck5hbWVdO1xuICAgICAgaWYgKG1lbWJlci5sb2NhdGlvbiA9PT0gXCJzdGF0dXNDb2RlXCIpIHtcbiAgICAgICAgY29uc3QgbmFtZSA9IG1lbWJlci5sb2NhdGlvbk5hbWUgfHwgbWVtYmVyTmFtZTtcbiAgICAgICAgb3V0cHV0W25hbWVdID0gc3RhdHVzQ29kZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVzb2x2ZUJvZHkoXG4gICAgYm9keTogSHR0cFJlc3BvbnNlPFN0cmVhbVR5cGU+W1wiYm9keVwiXSA9IFwiXCJcbiAgKTogUHJvbWlzZTxVaW50OEFycmF5IHwgc3RyaW5nPiB7XG4gICAgaWYgKHR5cGVvZiBib2R5ID09PSBcInN0cmluZ1wiKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGJvZHkpO1xuICAgIH1cblxuICAgIGxldCBidWZmZXJQcm9taXNlOiBQcm9taXNlPFVpbnQ4QXJyYXk+O1xuICAgIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoYm9keSkpIHtcbiAgICAgIGJ1ZmZlclByb21pc2UgPSBQcm9taXNlLnJlc29sdmUoXG4gICAgICAgIG5ldyBVaW50OEFycmF5KGJvZHkuYnVmZmVyLCBib2R5LmJ5dGVPZmZzZXQsIGJvZHkuYnl0ZUxlbmd0aClcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChpc0FycmF5QnVmZmVyKGJvZHkpKSB7XG4gICAgICBidWZmZXJQcm9taXNlID0gUHJvbWlzZS5yZXNvbHZlKG5ldyBVaW50OEFycmF5KGJvZHksIDAsIGJvZHkuYnl0ZUxlbmd0aCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBidWZmZXJQcm9taXNlID0gdGhpcy5ib2R5Q29sbGVjdG9yKGJvZHkpO1xuICAgIH1cblxuICAgIHJldHVybiBidWZmZXJQcm9taXNlO1xuICB9XG5cbiAgcHJpdmF0ZSByZXNvbHZlQm9keVN0cmluZyhcbiAgICBib2R5OiBIdHRwUmVzcG9uc2U8U3RyZWFtVHlwZT5bXCJib2R5XCJdID0gXCJcIlxuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLnJlc29sdmVCb2R5KGJvZHkpLnRoZW4oYnVmZmVyID0+XG4gICAgICB0eXBlb2YgYnVmZmVyID09PSBcInN0cmluZ1wiID8gYnVmZmVyIDogdGhpcy51dGY4RW5jb2RlcihidWZmZXIpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVzcG9uc2VJc1N1Y2Nlc3NmdWwoc3RhdHVzQ29kZTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHN0YXR1c0NvZGUgPCAzMDA7XG4gIH1cbn1cbiJdfQ==

/***/ }),

/***/ 9410:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var protocol_timestamp_1 = __webpack_require__(27949);
var util_uri_escape_1 = __webpack_require__(58681);
var is_iterable_1 = __webpack_require__(6617);
var RestSerializer = /** @class */ (function () {
    function RestSerializer(endpoint, bodySerializer, base64Encoder, utf8Decoder) {
        this.endpoint = endpoint;
        this.bodySerializer = bodySerializer;
        this.base64Encoder = base64Encoder;
        this.utf8Decoder = utf8Decoder;
    }
    RestSerializer.prototype.serialize = function (operation, input) {
        var httpTrait = operation.http, inputModel = operation.input;
        var baseUri = this.endpoint.path + "/" + httpTrait.requestUri;
        // Depending on payload rules, body may be binary, or a string
        var body = this.serializeBody(operation, input);
        var serializedParts = this.serializeNonBody(inputModel.shape, input, baseUri);
        return tslib_1.__assign({}, this.endpoint, { body: body, headers: tslib_1.__assign({}, this.populateContentTypeHeader(operation, input), serializedParts.headers), method: httpTrait.method, query: serializedParts.query, path: serializedParts.uri });
    };
    RestSerializer.prototype.serializeBody = function (operation, input) {
        var inputModel = operation.input;
        var inputModelShape = inputModel.shape;
        var bodyMember = inputModel;
        var hasPayload = false;
        var memberName;
        var bodyInput = input;
        var method = operation.http.method;
        if (method === "GET" || method === "HEAD") {
            // GET and HEAD requests should not have a body
            return null;
        }
        var payloadName = inputModelShape.payload;
        if (payloadName) {
            hasPayload = true;
            bodyMember = inputModelShape.members[payloadName];
            memberName = bodyMember.locationName || payloadName;
            bodyInput = input[payloadName];
            // non-structure payloads should not be transformed
            if (bodyMember.shape.type !== "structure") {
                if (bodyInput === void 0 || bodyInput === null) {
                    return "";
                }
                return bodyInput;
            }
        }
        else {
            memberName = bodyMember.locationName;
        }
        return this.bodySerializer.build({
            hasPayload: hasPayload,
            input: bodyInput,
            member: bodyMember,
            memberName: memberName,
            operation: operation
        });
    };
    RestSerializer.prototype.serializeNonBody = function (shape, input, baseUri) {
        var e_1, _a;
        var headers = {};
        var query = {};
        // reduce consecutive slashes to a single slash
        var uri = baseUri.replace(/\/+/g, "/");
        // move existing query string params
        var uriParts = uri.split("?", 2);
        if (uriParts.length === 2) {
            this.parseQueryString(query, uriParts[1]);
            // remove query string from the URI since it has been processed
            uri = uriParts[0];
        }
        var members = shape.members;
        try {
            for (var _b = tslib_1.__values(Object.keys(members)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var memberName = _c.value;
                // check if input contains the member
                var inputValue = input[memberName];
                if (typeof inputValue === "undefined" || inputValue === null) {
                    continue;
                }
                var member = members[memberName];
                var location = member.location, _d = member.locationName, locationName = _d === void 0 ? memberName : _d;
                if (location === "header" || location === "headers") {
                    this.populateHeader(headers, member, locationName, inputValue);
                }
                else if (location === "uri") {
                    uri = this.populateUri(uri, locationName, inputValue);
                }
                else if (location === "querystring") {
                    this.populateQuery(query, member, locationName, inputValue);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return { headers: headers, query: query, uri: uri };
    };
    RestSerializer.prototype.populateQuery = function (query, member, name, input) {
        var e_2, _a, e_3, _b, e_4, _c;
        var shape = member.shape;
        if (shape.type === "list") {
            var values = [];
            if (is_iterable_1.isIterable(input)) {
                try {
                    for (var input_1 = tslib_1.__values(input), input_1_1 = input_1.next(); !input_1_1.done; input_1_1 = input_1.next()) {
                        var value = input_1_1.value;
                        values.push(String(value));
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (input_1_1 && !input_1_1.done && (_a = input_1.return)) _a.call(input_1);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
                query[name] = values;
            }
            else {
                throw new Error("Unable to serialize value that is neither an array nor an" +
                    " iterable as a list");
            }
        }
        else if (shape.type === "map") {
            if (is_iterable_1.isIterable(input)) {
                try {
                    for (var input_2 = tslib_1.__values(input), input_2_1 = input_2.next(); !input_2_1.done; input_2_1 = input_2.next()) {
                        var _d = tslib_1.__read(input_2_1.value, 2), inputKey = _d[0], inputValue = _d[1];
                        this.populateQuery(query, shape.value, inputKey, inputValue);
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (input_2_1 && !input_2_1.done && (_b = input_2.return)) _b.call(input_2);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
            }
            else if (typeof input === "object" && input !== null) {
                try {
                    for (var _e = tslib_1.__values(Object.keys(input)), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var inputKey = _f.value;
                        var inputValue = input[inputKey];
                        this.populateQuery(query, shape.value, inputKey, inputValue);
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_c = _e.return)) _c.call(_e);
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            }
        }
        else if (shape.type === "timestamp") {
            query[name] = encodeURIComponent(String(protocol_timestamp_1.formatTimestamp(input, member.timestampFormat || shape.timestampFormat || "iso8601")));
        }
        else {
            query[name] = String(input);
        }
    };
    RestSerializer.prototype.populateUri = function (uri, name, input) {
        var regex = new RegExp("\\{" + name + "(\\+)?\\}");
        // using match instead of replace ends up being > twice as fast in V8
        var results = uri.match(regex);
        if (results) {
            var _a = tslib_1.__read(results, 2), fullMatch = _a[0], plus = _a[1];
            var index = results.index;
            var escapedInputValue = plus ? util_uri_escape_1.escapeUriPath(input) : util_uri_escape_1.escapeUri(input);
            uri =
                uri.substr(0, index) +
                    escapedInputValue +
                    uri.substr(index + fullMatch.length);
        }
        return uri;
    };
    RestSerializer.prototype.populateHeader = function (headers, member, name, input) {
        var e_5, _a, e_6, _b;
        var shape = member.shape;
        if (shape.type === "map") {
            if (is_iterable_1.isIterable(input)) {
                try {
                    for (var input_3 = tslib_1.__values(input), input_3_1 = input_3.next(); !input_3_1.done; input_3_1 = input_3.next()) {
                        var _c = tslib_1.__read(input_3_1.value, 2), inputKey = _c[0], inputValue = _c[1];
                        headers[name + inputKey] = String(inputValue);
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (input_3_1 && !input_3_1.done && (_a = input_3.return)) _a.call(input_3);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
            }
            else if (typeof input === "object" && input !== null) {
                try {
                    for (var _d = tslib_1.__values(Object.keys(input)), _e = _d.next(); !_e.done; _e = _d.next()) {
                        var inputKey = _e.value;
                        headers[name + inputKey] = String(input[inputKey]);
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            }
        }
        else {
            switch (shape.type) {
                case "timestamp":
                    headers[name] = String(protocol_timestamp_1.formatTimestamp(input, member.timestampFormat || shape.timestampFormat || "rfc822"));
                    break;
                case "string":
                    headers[name] = shape.jsonValue
                        ? this.base64Encoder(this.utf8Decoder(JSON.stringify(input)))
                        : input;
                    break;
                case "integer":
                    headers[name] = parseInt(input).toString();
                    break;
                case "float":
                    headers[name] = parseFloat(input).toString();
                    break;
                case "blob": {
                    input = typeof input === "string" ? this.utf8Decoder(input) : input;
                    headers[name] = this.base64Encoder(input);
                    break;
                }
                default:
                    headers[name] = input.toString();
            }
        }
    };
    /**
     * Used to parse modeled paths that already include query strings.
     * Does not attempt to unescape values.
     * @param queryString
     */
    RestSerializer.prototype.parseQueryString = function (query, queryString) {
        var e_7, _a;
        try {
            // get individual keys
            for (var _b = tslib_1.__values(queryString.split("&")), _c = _b.next(); !_c.done; _c = _b.next()) {
                var keyValues = _c.value;
                var _d = tslib_1.__read(keyValues.split("="), 2), key = _d[0], value = _d[1];
                if (query.hasOwnProperty(key)) {
                    if (Array.isArray(query[key])) {
                        query[key].push(value);
                    }
                    else {
                        query[key] = [query[key], value];
                    }
                }
                else {
                    query[key] = value;
                }
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_7) throw e_7.error; }
        }
    };
    /**
     * @api private
     *
     * Add Content-Type header for rest-json protocol explicitly
     * If payload is supplied in input, the content-type should be set according to payload shape;
     * If payload is specified but not supplied in input, no content-type header is needed;
     * If there's no payload in input shape, set content-type as 'application/json';
     * @param operation
     * @param input
     */
    RestSerializer.prototype.populateContentTypeHeader = function (operation, input) {
        var contentTypeHeader = {};
        var inputShape = operation.input, protocol = operation.metadata.protocol;
        if (protocol !== "rest-json")
            return contentTypeHeader;
        if (typeof inputShape.shape.payload === "string") {
            var payloadMemberName = inputShape.shape.payload;
            var payloadMember = inputShape.shape.members[payloadMemberName];
            var payload = input[payloadMemberName];
            if (!payload)
                return contentTypeHeader;
            if (payloadMember.shape.type === "structure") {
                return { "Content-Type": "application/json" };
            }
            else if (payloadMember.shape.type === "blob") {
                return { "Content-Type": "binary/octet-stream" };
            }
        }
        else {
            return { "Content-Type": "application/json" };
        }
        return contentTypeHeader;
    };
    return RestSerializer;
}());
exports.RestSerializer = RestSerializer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVzdFNlcmlhbGl6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvUmVzdFNlcmlhbGl6ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0VBQThEO0FBa0I5RCw0REFBb0U7QUFFcEUsb0RBQWtEO0FBTWxEO0lBRUUsd0JBQ21CLFFBQXNCLEVBQ3RCLGNBQXNDLEVBQ3RDLGFBQXNCLEVBQy9CLFdBQW9CO1FBSFgsYUFBUSxHQUFSLFFBQVEsQ0FBYztRQUN0QixtQkFBYyxHQUFkLGNBQWMsQ0FBd0I7UUFDdEMsa0JBQWEsR0FBYixhQUFhLENBQVM7UUFDL0IsZ0JBQVcsR0FBWCxXQUFXLENBQVM7SUFDM0IsQ0FBQztJQUVHLGtDQUFTLEdBQWhCLFVBQ0UsU0FBeUIsRUFDekIsS0FBVTtRQUVGLElBQUEsMEJBQWUsRUFBRSw0QkFBaUIsQ0FBZTtRQUV6RCxJQUFNLE9BQU8sR0FBYyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksU0FBSSxTQUFTLENBQUMsVUFBWSxDQUFDO1FBRXhFLDhEQUE4RDtRQUM5RCxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsRCxJQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQzNDLFVBQVUsQ0FBQyxLQUF1QixFQUNsQyxLQUFLLEVBQ0wsT0FBTyxDQUNSLENBQUM7UUFFRiw0QkFDSyxJQUFJLENBQUMsUUFBUSxJQUNoQixJQUFJLE1BQUEsRUFDSixPQUFPLHVCQUNGLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLEVBQ2hELGVBQWUsQ0FBQyxPQUFPLEdBRTVCLE1BQU0sRUFBRSxTQUFTLENBQUMsTUFBTSxFQUN4QixLQUFLLEVBQUUsZUFBZSxDQUFDLEtBQUssRUFDNUIsSUFBSSxFQUFFLGVBQWUsQ0FBQyxHQUFHLElBQ3pCO0lBQ0osQ0FBQztJQUVPLHNDQUFhLEdBQXJCLFVBQXNCLFNBQXlCLEVBQUUsS0FBVTtRQUN6RCxJQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDO1FBQ25DLElBQU0sZUFBZSxHQUFHLFVBQVUsQ0FBQyxLQUF1QixDQUFDO1FBRTNELElBQUksVUFBVSxHQUFXLFVBQVUsQ0FBQztRQUNwQyxJQUFJLFVBQVUsR0FBWSxLQUFLLENBQUM7UUFDaEMsSUFBSSxVQUE4QixDQUFDO1FBQ25DLElBQUksU0FBUyxHQUFRLEtBQUssQ0FBQztRQUMzQixJQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNyQyxJQUFJLE1BQU0sS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUN6QywrQ0FBK0M7WUFDL0MsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELElBQU0sV0FBVyxHQUFXLGVBQWUsQ0FBQyxPQUFpQixDQUFDO1FBQzlELElBQUksV0FBVyxFQUFFO1lBQ2YsVUFBVSxHQUFHLElBQUksQ0FBQztZQUNsQixVQUFVLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNsRCxVQUFVLEdBQUcsVUFBVSxDQUFDLFlBQVksSUFBSSxXQUFXLENBQUM7WUFDcEQsU0FBUyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUUvQixtREFBbUQ7WUFDbkQsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7Z0JBQ3pDLElBQUksU0FBUyxLQUFLLEtBQUssQ0FBQyxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7b0JBQzlDLE9BQU8sRUFBRSxDQUFDO2lCQUNYO2dCQUNELE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1NBQ0Y7YUFBTTtZQUNMLFVBQVUsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDO1NBQ3RDO1FBRUQsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztZQUMvQixVQUFVLFlBQUE7WUFDVixLQUFLLEVBQUUsU0FBUztZQUNoQixNQUFNLEVBQUUsVUFBVTtZQUNsQixVQUFVLFlBQUE7WUFDVixTQUFTLFdBQUE7U0FDVixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRU8seUNBQWdCLEdBQXhCLFVBQXlCLEtBQXFCLEVBQUUsS0FBVSxFQUFFLE9BQWU7O1FBQ3pFLElBQU0sT0FBTyxHQUFjLEVBQUUsQ0FBQztRQUM5QixJQUFNLEtBQUssR0FBc0IsRUFBRSxDQUFDO1FBQ3BDLCtDQUErQztRQUMvQyxJQUFJLEdBQUcsR0FBVyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUUvQyxvQ0FBb0M7UUFDcEMsSUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbkMsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN6QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFDLCtEQUErRDtZQUMvRCxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ25CO1FBRUQsSUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQzs7WUFDOUIsS0FBdUIsSUFBQSxLQUFBLGlCQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUEsZ0JBQUEsNEJBQUU7Z0JBQXhDLElBQUksVUFBVSxXQUFBO2dCQUNqQixxQ0FBcUM7Z0JBQ3JDLElBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDckMsSUFBSSxPQUFPLFVBQVUsS0FBSyxXQUFXLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtvQkFDNUQsU0FBUztpQkFDVjtnQkFFRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQzNCLElBQUEsMEJBQVEsRUFBRSx3QkFBeUIsRUFBekIsOENBQXlCLENBQVk7Z0JBRXZELElBQUksUUFBUSxLQUFLLFFBQVEsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO29CQUNuRCxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsWUFBWSxFQUFFLFVBQVUsQ0FBQyxDQUFDO2lCQUNoRTtxQkFBTSxJQUFJLFFBQVEsS0FBSyxLQUFLLEVBQUU7b0JBQzdCLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7aUJBQ3ZEO3FCQUFNLElBQUksUUFBUSxLQUFLLGFBQWEsRUFBRTtvQkFDckMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztpQkFDN0Q7YUFDRjs7Ozs7Ozs7O1FBRUQsT0FBTyxFQUFFLE9BQU8sU0FBQSxFQUFFLEtBQUssT0FBQSxFQUFFLEdBQUcsS0FBQSxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVPLHNDQUFhLEdBQXJCLFVBQ0UsS0FBd0IsRUFDeEIsTUFBYyxFQUNkLElBQVksRUFDWixLQUFVOztRQUVWLElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDM0IsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUN6QixJQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7WUFDbEIsSUFBSSx3QkFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFOztvQkFDckIsS0FBa0IsSUFBQSxVQUFBLGlCQUFBLEtBQUssQ0FBQSw0QkFBQSwrQ0FBRTt3QkFBcEIsSUFBSSxLQUFLLGtCQUFBO3dCQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7cUJBQzVCOzs7Ozs7Ozs7Z0JBQ0QsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sQ0FBQzthQUN0QjtpQkFBTTtnQkFDTCxNQUFNLElBQUksS0FBSyxDQUNiLDJEQUEyRDtvQkFDekQscUJBQXFCLENBQ3hCLENBQUM7YUFDSDtTQUNGO2FBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssRUFBRTtZQUMvQixJQUFJLHdCQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7O29CQUNyQixLQUFtQyxJQUFBLFVBQUEsaUJBQUEsS0FBSyxDQUFBLDRCQUFBLCtDQUFFO3dCQUFqQyxJQUFBLHVDQUFzQixFQUFyQixnQkFBUSxFQUFFLGtCQUFVO3dCQUM1QixJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztxQkFDOUQ7Ozs7Ozs7OzthQUNGO2lCQUFNLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7O29CQUN0RCxLQUFxQixJQUFBLEtBQUEsaUJBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQSxnQkFBQSw0QkFBRTt3QkFBcEMsSUFBSSxRQUFRLFdBQUE7d0JBQ2YsSUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNuQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztxQkFDOUQ7Ozs7Ozs7OzthQUNGO1NBQ0Y7YUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFO1lBQ3JDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxrQkFBa0IsQ0FDOUIsTUFBTSxDQUNKLG9DQUFlLENBQ2IsS0FBSyxFQUNMLE1BQU0sQ0FBQyxlQUFlLElBQUksS0FBSyxDQUFDLGVBQWUsSUFBSSxTQUFTLENBQzdELENBQ0YsQ0FDRixDQUFDO1NBQ0g7YUFBTTtZQUNMLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDN0I7SUFDSCxDQUFDO0lBRU8sb0NBQVcsR0FBbkIsVUFBb0IsR0FBVyxFQUFFLElBQVksRUFBRSxLQUFVO1FBQ3ZELElBQU0sS0FBSyxHQUFHLElBQUksTUFBTSxDQUFDLFFBQU0sSUFBSSxjQUFXLENBQUMsQ0FBQztRQUNoRCxxRUFBcUU7UUFDckUsSUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxJQUFJLE9BQU8sRUFBRTtZQUNMLElBQUEsK0JBQTJCLEVBQTFCLGlCQUFTLEVBQUUsWUFBZSxDQUFDO1lBQ2xDLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFlLENBQUM7WUFDdEMsSUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLCtCQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLDJCQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekUsR0FBRztnQkFDRCxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUM7b0JBQ3BCLGlCQUFpQjtvQkFDakIsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBQ08sdUNBQWMsR0FBdEIsVUFDRSxPQUFrQixFQUNsQixNQUFjLEVBQ2QsSUFBWSxFQUNaLEtBQVU7O1FBRVYsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUMzQixJQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssS0FBSyxFQUFFO1lBQ3hCLElBQUksd0JBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTs7b0JBQ3JCLEtBQW1DLElBQUEsVUFBQSxpQkFBQSxLQUFLLENBQUEsNEJBQUEsK0NBQUU7d0JBQWpDLElBQUEsdUNBQXNCLEVBQXJCLGdCQUFRLEVBQUUsa0JBQVU7d0JBQzVCLE9BQU8sQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUMvQzs7Ozs7Ozs7O2FBQ0Y7aUJBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTs7b0JBQ3RELEtBQXFCLElBQUEsS0FBQSxpQkFBQSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBLGdCQUFBLDRCQUFFO3dCQUFwQyxJQUFJLFFBQVEsV0FBQTt3QkFDZixPQUFPLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztxQkFDcEQ7Ozs7Ozs7OzthQUNGO1NBQ0Y7YUFBTTtZQUNMLFFBQVEsS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDbEIsS0FBSyxXQUFXO29CQUNkLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQ3BCLG9DQUFlLENBQ2IsS0FBSyxFQUNMLE1BQU0sQ0FBQyxlQUFlLElBQUksS0FBSyxDQUFDLGVBQWUsSUFBSSxRQUFRLENBQzVELENBQ0YsQ0FBQztvQkFDRixNQUFNO2dCQUNSLEtBQUssUUFBUTtvQkFDWCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVM7d0JBQzdCLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO3dCQUM3RCxDQUFDLENBQUMsS0FBSyxDQUFDO29CQUNWLE1BQU07Z0JBQ1IsS0FBSyxTQUFTO29CQUNaLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzNDLE1BQU07Z0JBQ1IsS0FBSyxPQUFPO29CQUNWLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7b0JBQzdDLE1BQU07Z0JBQ1IsS0FBSyxNQUFNLENBQUMsQ0FBQztvQkFDWCxLQUFLLEdBQUcsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQ3BFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMxQyxNQUFNO2lCQUNQO2dCQUNEO29CQUNFLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDcEM7U0FDRjtJQUNILENBQUM7SUFFRDs7OztPQUlHO0lBQ0sseUNBQWdCLEdBQXhCLFVBQ0UsS0FBd0IsRUFDeEIsV0FBbUI7OztZQUVuQixzQkFBc0I7WUFDdEIsS0FBc0IsSUFBQSxLQUFBLGlCQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUEsZ0JBQUEsNEJBQUU7Z0JBQXpDLElBQUksU0FBUyxXQUFBO2dCQUNWLElBQUEsNENBQW1DLEVBQWxDLFdBQUcsRUFBRSxhQUE2QixDQUFDO2dCQUMxQyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQzdCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTt3QkFDNUIsS0FBSyxDQUFDLEdBQUcsQ0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDdEM7eUJBQU07d0JBQ0wsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQVMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO3FCQUMxQztpQkFDRjtxQkFBTTtvQkFDTCxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO2lCQUNwQjthQUNGOzs7Ozs7Ozs7SUFDSCxDQUFDO0lBRUQ7Ozs7Ozs7OztPQVNHO0lBQ0ssa0RBQXlCLEdBQWpDLFVBQ0UsU0FBeUIsRUFDekIsS0FBVTtRQUVWLElBQU0saUJBQWlCLEdBQUcsRUFBRSxDQUFDO1FBRTNCLElBQUEsNEJBQWlCLEVBQ0wsc0NBQVEsQ0FDUjtRQUNkLElBQUksUUFBUSxLQUFLLFdBQVc7WUFBRSxPQUFPLGlCQUFpQixDQUFDO1FBQ3ZELElBQUksT0FBUSxVQUFVLENBQUMsS0FBbUIsQ0FBQyxPQUFPLEtBQUssUUFBUSxFQUFFO1lBQy9ELElBQU0saUJBQWlCLEdBQUksVUFBVSxDQUFDLEtBQW1CLENBQUMsT0FBUSxDQUFDO1lBQ25FLElBQU0sYUFBYSxHQUFJLFVBQVUsQ0FBQyxLQUFtQixDQUFDLE9BQU8sQ0FDM0QsaUJBQWlCLENBQ2xCLENBQUM7WUFDRixJQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsT0FBTztnQkFBRSxPQUFPLGlCQUFpQixDQUFDO1lBQ3ZDLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssV0FBVyxFQUFFO2dCQUM1QyxPQUFPLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLENBQUM7YUFDL0M7aUJBQU0sSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7Z0JBQzlDLE9BQU8sRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUUsQ0FBQzthQUNsRDtTQUNGO2FBQU07WUFDTCxPQUFPLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLENBQUM7U0FDL0M7UUFDRCxPQUFPLGlCQUFpQixDQUFDO0lBQzNCLENBQUM7SUFDSCxxQkFBQztBQUFELENBQUMsQUE5UkQsSUE4UkM7QUE5Ulksd0NBQWMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBmb3JtYXRUaW1lc3RhbXAgfSBmcm9tIFwiQGF3cy1zZGsvcHJvdG9jb2wtdGltZXN0YW1wXCI7XG5pbXBvcnQge1xuICBCb2R5U2VyaWFsaXplcixcbiAgRGVjb2RlcixcbiAgRW5jb2RlcixcbiAgSGVhZGVyQmFnLFxuICBIdHRwRW5kcG9pbnQsXG4gIEh0dHBSZXF1ZXN0LFxuICBNZW1iZXIsXG4gIE9wZXJhdGlvbk1vZGVsLFxuICBRdWVyeVBhcmFtZXRlckJhZyxcbiAgUmVxdWVzdFNlcmlhbGl6ZXIsXG4gIFNlcmlhbGl6YXRpb25Nb2RlbCxcbiAgU3RydWN0dXJlIGFzIFN0cnVjdHVyZVNoYXBlLFxuICBTdXBwb3J0ZWRQcm90b2NvbCxcbiAgU3RydWN0dXJlXG59IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG5pbXBvcnQgeyBlc2NhcGVVcmksIGVzY2FwZVVyaVBhdGggfSBmcm9tIFwiQGF3cy1zZGsvdXRpbC11cmktZXNjYXBlXCI7XG5cbmltcG9ydCB7IGlzSXRlcmFibGUgfSBmcm9tIFwiQGF3cy1zZGsvaXMtaXRlcmFibGVcIjtcblxuZXhwb3J0IGludGVyZmFjZSBVc2VySW5wdXQge1xuICBba2V5OiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBSZXN0U2VyaWFsaXplcjxTdHJlYW1UeXBlPlxuICBpbXBsZW1lbnRzIFJlcXVlc3RTZXJpYWxpemVyPFN0cmVhbVR5cGU+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBlbmRwb2ludDogSHR0cEVuZHBvaW50LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgYm9keVNlcmlhbGl6ZXI6IEJvZHlTZXJpYWxpemVyPHN0cmluZz4sXG4gICAgcHJpdmF0ZSByZWFkb25seSBiYXNlNjRFbmNvZGVyOiBFbmNvZGVyLFxuICAgIHByaXZhdGUgdXRmOERlY29kZXI6IERlY29kZXJcbiAgKSB7fVxuXG4gIHB1YmxpYyBzZXJpYWxpemUoXG4gICAgb3BlcmF0aW9uOiBPcGVyYXRpb25Nb2RlbCxcbiAgICBpbnB1dDogYW55XG4gICk6IEh0dHBSZXF1ZXN0PFN0cmVhbVR5cGU+IHtcbiAgICBjb25zdCB7IGh0dHA6IGh0dHBUcmFpdCwgaW5wdXQ6IGlucHV0TW9kZWwgfSA9IG9wZXJhdGlvbjtcblxuICAgIGNvbnN0IGJhc2VVcmk6IHN0cmluZyA9IGAke3RoaXMuZW5kcG9pbnQucGF0aH0vJHtodHRwVHJhaXQucmVxdWVzdFVyaX1gO1xuXG4gICAgLy8gRGVwZW5kaW5nIG9uIHBheWxvYWQgcnVsZXMsIGJvZHkgbWF5IGJlIGJpbmFyeSwgb3IgYSBzdHJpbmdcbiAgICBjb25zdCBib2R5ID0gdGhpcy5zZXJpYWxpemVCb2R5KG9wZXJhdGlvbiwgaW5wdXQpO1xuICAgIGNvbnN0IHNlcmlhbGl6ZWRQYXJ0cyA9IHRoaXMuc2VyaWFsaXplTm9uQm9keShcbiAgICAgIGlucHV0TW9kZWwuc2hhcGUgYXMgU3RydWN0dXJlU2hhcGUsXG4gICAgICBpbnB1dCxcbiAgICAgIGJhc2VVcmlcbiAgICApO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIC4uLnRoaXMuZW5kcG9pbnQsXG4gICAgICBib2R5LFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAuLi50aGlzLnBvcHVsYXRlQ29udGVudFR5cGVIZWFkZXIob3BlcmF0aW9uLCBpbnB1dCksXG4gICAgICAgIC4uLnNlcmlhbGl6ZWRQYXJ0cy5oZWFkZXJzXG4gICAgICB9LFxuICAgICAgbWV0aG9kOiBodHRwVHJhaXQubWV0aG9kLFxuICAgICAgcXVlcnk6IHNlcmlhbGl6ZWRQYXJ0cy5xdWVyeSxcbiAgICAgIHBhdGg6IHNlcmlhbGl6ZWRQYXJ0cy51cmlcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzZXJpYWxpemVCb2R5KG9wZXJhdGlvbjogT3BlcmF0aW9uTW9kZWwsIGlucHV0OiBhbnkpOiBhbnkge1xuICAgIGNvbnN0IGlucHV0TW9kZWwgPSBvcGVyYXRpb24uaW5wdXQ7XG4gICAgY29uc3QgaW5wdXRNb2RlbFNoYXBlID0gaW5wdXRNb2RlbC5zaGFwZSBhcyBTdHJ1Y3R1cmVTaGFwZTtcblxuICAgIGxldCBib2R5TWVtYmVyOiBNZW1iZXIgPSBpbnB1dE1vZGVsO1xuICAgIGxldCBoYXNQYXlsb2FkOiBib29sZWFuID0gZmFsc2U7XG4gICAgbGV0IG1lbWJlck5hbWU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgYm9keUlucHV0OiBhbnkgPSBpbnB1dDtcbiAgICBjb25zdCBtZXRob2QgPSBvcGVyYXRpb24uaHR0cC5tZXRob2Q7XG4gICAgaWYgKG1ldGhvZCA9PT0gXCJHRVRcIiB8fCBtZXRob2QgPT09IFwiSEVBRFwiKSB7XG4gICAgICAvLyBHRVQgYW5kIEhFQUQgcmVxdWVzdHMgc2hvdWxkIG5vdCBoYXZlIGEgYm9keVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgcGF5bG9hZE5hbWU6IHN0cmluZyA9IGlucHV0TW9kZWxTaGFwZS5wYXlsb2FkIGFzIHN0cmluZztcbiAgICBpZiAocGF5bG9hZE5hbWUpIHtcbiAgICAgIGhhc1BheWxvYWQgPSB0cnVlO1xuICAgICAgYm9keU1lbWJlciA9IGlucHV0TW9kZWxTaGFwZS5tZW1iZXJzW3BheWxvYWROYW1lXTtcbiAgICAgIG1lbWJlck5hbWUgPSBib2R5TWVtYmVyLmxvY2F0aW9uTmFtZSB8fCBwYXlsb2FkTmFtZTtcbiAgICAgIGJvZHlJbnB1dCA9IGlucHV0W3BheWxvYWROYW1lXTtcblxuICAgICAgLy8gbm9uLXN0cnVjdHVyZSBwYXlsb2FkcyBzaG91bGQgbm90IGJlIHRyYW5zZm9ybWVkXG4gICAgICBpZiAoYm9keU1lbWJlci5zaGFwZS50eXBlICE9PSBcInN0cnVjdHVyZVwiKSB7XG4gICAgICAgIGlmIChib2R5SW5wdXQgPT09IHZvaWQgMCB8fCBib2R5SW5wdXQgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYm9keUlucHV0O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBtZW1iZXJOYW1lID0gYm9keU1lbWJlci5sb2NhdGlvbk5hbWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYm9keVNlcmlhbGl6ZXIuYnVpbGQoe1xuICAgICAgaGFzUGF5bG9hZCxcbiAgICAgIGlucHV0OiBib2R5SW5wdXQsXG4gICAgICBtZW1iZXI6IGJvZHlNZW1iZXIsXG4gICAgICBtZW1iZXJOYW1lLFxuICAgICAgb3BlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHNlcmlhbGl6ZU5vbkJvZHkoc2hhcGU6IFN0cnVjdHVyZVNoYXBlLCBpbnB1dDogYW55LCBiYXNlVXJpOiBzdHJpbmcpIHtcbiAgICBjb25zdCBoZWFkZXJzOiBIZWFkZXJCYWcgPSB7fTtcbiAgICBjb25zdCBxdWVyeTogUXVlcnlQYXJhbWV0ZXJCYWcgPSB7fTtcbiAgICAvLyByZWR1Y2UgY29uc2VjdXRpdmUgc2xhc2hlcyB0byBhIHNpbmdsZSBzbGFzaFxuICAgIGxldCB1cmk6IHN0cmluZyA9IGJhc2VVcmkucmVwbGFjZSgvXFwvKy9nLCBcIi9cIik7XG5cbiAgICAvLyBtb3ZlIGV4aXN0aW5nIHF1ZXJ5IHN0cmluZyBwYXJhbXNcbiAgICBjb25zdCB1cmlQYXJ0cyA9IHVyaS5zcGxpdChcIj9cIiwgMik7XG4gICAgaWYgKHVyaVBhcnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgdGhpcy5wYXJzZVF1ZXJ5U3RyaW5nKHF1ZXJ5LCB1cmlQYXJ0c1sxXSk7XG4gICAgICAvLyByZW1vdmUgcXVlcnkgc3RyaW5nIGZyb20gdGhlIFVSSSBzaW5jZSBpdCBoYXMgYmVlbiBwcm9jZXNzZWRcbiAgICAgIHVyaSA9IHVyaVBhcnRzWzBdO1xuICAgIH1cblxuICAgIGNvbnN0IG1lbWJlcnMgPSBzaGFwZS5tZW1iZXJzO1xuICAgIGZvciAobGV0IG1lbWJlck5hbWUgb2YgT2JqZWN0LmtleXMobWVtYmVycykpIHtcbiAgICAgIC8vIGNoZWNrIGlmIGlucHV0IGNvbnRhaW5zIHRoZSBtZW1iZXJcbiAgICAgIGNvbnN0IGlucHV0VmFsdWUgPSBpbnB1dFttZW1iZXJOYW1lXTtcbiAgICAgIGlmICh0eXBlb2YgaW5wdXRWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCBpbnB1dFZhbHVlID09PSBudWxsKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtZW1iZXIgPSBtZW1iZXJzW21lbWJlck5hbWVdO1xuICAgICAgY29uc3QgeyBsb2NhdGlvbiwgbG9jYXRpb25OYW1lID0gbWVtYmVyTmFtZSB9ID0gbWVtYmVyO1xuXG4gICAgICBpZiAobG9jYXRpb24gPT09IFwiaGVhZGVyXCIgfHwgbG9jYXRpb24gPT09IFwiaGVhZGVyc1wiKSB7XG4gICAgICAgIHRoaXMucG9wdWxhdGVIZWFkZXIoaGVhZGVycywgbWVtYmVyLCBsb2NhdGlvbk5hbWUsIGlucHV0VmFsdWUpO1xuICAgICAgfSBlbHNlIGlmIChsb2NhdGlvbiA9PT0gXCJ1cmlcIikge1xuICAgICAgICB1cmkgPSB0aGlzLnBvcHVsYXRlVXJpKHVyaSwgbG9jYXRpb25OYW1lLCBpbnB1dFZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAobG9jYXRpb24gPT09IFwicXVlcnlzdHJpbmdcIikge1xuICAgICAgICB0aGlzLnBvcHVsYXRlUXVlcnkocXVlcnksIG1lbWJlciwgbG9jYXRpb25OYW1lLCBpbnB1dFZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4geyBoZWFkZXJzLCBxdWVyeSwgdXJpIH07XG4gIH1cblxuICBwcml2YXRlIHBvcHVsYXRlUXVlcnkoXG4gICAgcXVlcnk6IFF1ZXJ5UGFyYW1ldGVyQmFnLFxuICAgIG1lbWJlcjogTWVtYmVyLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBpbnB1dDogYW55XG4gICkge1xuICAgIGNvbnN0IHNoYXBlID0gbWVtYmVyLnNoYXBlO1xuICAgIGlmIChzaGFwZS50eXBlID09PSBcImxpc3RcIikge1xuICAgICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgICBpZiAoaXNJdGVyYWJsZShpbnB1dCkpIHtcbiAgICAgICAgZm9yIChsZXQgdmFsdWUgb2YgaW5wdXQpIHtcbiAgICAgICAgICB2YWx1ZXMucHVzaChTdHJpbmcodmFsdWUpKTtcbiAgICAgICAgfVxuICAgICAgICBxdWVyeVtuYW1lXSA9IHZhbHVlcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBcIlVuYWJsZSB0byBzZXJpYWxpemUgdmFsdWUgdGhhdCBpcyBuZWl0aGVyIGFuIGFycmF5IG5vciBhblwiICtcbiAgICAgICAgICAgIFwiIGl0ZXJhYmxlIGFzIGEgbGlzdFwiXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSBcIm1hcFwiKSB7XG4gICAgICBpZiAoaXNJdGVyYWJsZShpbnB1dCkpIHtcbiAgICAgICAgZm9yIChsZXQgW2lucHV0S2V5LCBpbnB1dFZhbHVlXSBvZiBpbnB1dCkge1xuICAgICAgICAgIHRoaXMucG9wdWxhdGVRdWVyeShxdWVyeSwgc2hhcGUudmFsdWUsIGlucHV0S2V5LCBpbnB1dFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09IFwib2JqZWN0XCIgJiYgaW5wdXQgIT09IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgY29uc3QgaW5wdXRWYWx1ZSA9IGlucHV0W2lucHV0S2V5XTtcbiAgICAgICAgICB0aGlzLnBvcHVsYXRlUXVlcnkocXVlcnksIHNoYXBlLnZhbHVlLCBpbnB1dEtleSwgaW5wdXRWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09IFwidGltZXN0YW1wXCIpIHtcbiAgICAgIHF1ZXJ5W25hbWVdID0gZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICBTdHJpbmcoXG4gICAgICAgICAgZm9ybWF0VGltZXN0YW1wKFxuICAgICAgICAgICAgaW5wdXQsXG4gICAgICAgICAgICBtZW1iZXIudGltZXN0YW1wRm9ybWF0IHx8IHNoYXBlLnRpbWVzdGFtcEZvcm1hdCB8fCBcImlzbzg2MDFcIlxuICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcXVlcnlbbmFtZV0gPSBTdHJpbmcoaW5wdXQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcG9wdWxhdGVVcmkodXJpOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgaW5wdXQ6IGFueSk6IHN0cmluZyB7XG4gICAgY29uc3QgcmVnZXggPSBuZXcgUmVnRXhwKGBcXFxceyR7bmFtZX0oXFxcXCspP1xcXFx9YCk7XG4gICAgLy8gdXNpbmcgbWF0Y2ggaW5zdGVhZCBvZiByZXBsYWNlIGVuZHMgdXAgYmVpbmcgPiB0d2ljZSBhcyBmYXN0IGluIFY4XG4gICAgY29uc3QgcmVzdWx0cyA9IHVyaS5tYXRjaChyZWdleCk7XG4gICAgaWYgKHJlc3VsdHMpIHtcbiAgICAgIGNvbnN0IFtmdWxsTWF0Y2gsIHBsdXNdID0gcmVzdWx0cztcbiAgICAgIGNvbnN0IGluZGV4ID0gcmVzdWx0cy5pbmRleCBhcyBudW1iZXI7XG4gICAgICBjb25zdCBlc2NhcGVkSW5wdXRWYWx1ZSA9IHBsdXMgPyBlc2NhcGVVcmlQYXRoKGlucHV0KSA6IGVzY2FwZVVyaShpbnB1dCk7XG4gICAgICB1cmkgPVxuICAgICAgICB1cmkuc3Vic3RyKDAsIGluZGV4KSArXG4gICAgICAgIGVzY2FwZWRJbnB1dFZhbHVlICtcbiAgICAgICAgdXJpLnN1YnN0cihpbmRleCArIGZ1bGxNYXRjaC5sZW5ndGgpO1xuICAgIH1cbiAgICByZXR1cm4gdXJpO1xuICB9XG4gIHByaXZhdGUgcG9wdWxhdGVIZWFkZXIoXG4gICAgaGVhZGVyczogSGVhZGVyQmFnLFxuICAgIG1lbWJlcjogTWVtYmVyLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBpbnB1dDogYW55XG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHNoYXBlID0gbWVtYmVyLnNoYXBlO1xuICAgIGlmIChzaGFwZS50eXBlID09PSBcIm1hcFwiKSB7XG4gICAgICBpZiAoaXNJdGVyYWJsZShpbnB1dCkpIHtcbiAgICAgICAgZm9yIChsZXQgW2lucHV0S2V5LCBpbnB1dFZhbHVlXSBvZiBpbnB1dCkge1xuICAgICAgICAgIGhlYWRlcnNbbmFtZSArIGlucHV0S2V5XSA9IFN0cmluZyhpbnB1dFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgaW5wdXQgPT09IFwib2JqZWN0XCIgJiYgaW5wdXQgIT09IG51bGwpIHtcbiAgICAgICAgZm9yIChsZXQgaW5wdXRLZXkgb2YgT2JqZWN0LmtleXMoaW5wdXQpKSB7XG4gICAgICAgICAgaGVhZGVyc1tuYW1lICsgaW5wdXRLZXldID0gU3RyaW5nKGlucHV0W2lucHV0S2V5XSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3dpdGNoIChzaGFwZS50eXBlKSB7XG4gICAgICAgIGNhc2UgXCJ0aW1lc3RhbXBcIjpcbiAgICAgICAgICBoZWFkZXJzW25hbWVdID0gU3RyaW5nKFxuICAgICAgICAgICAgZm9ybWF0VGltZXN0YW1wKFxuICAgICAgICAgICAgICBpbnB1dCxcbiAgICAgICAgICAgICAgbWVtYmVyLnRpbWVzdGFtcEZvcm1hdCB8fCBzaGFwZS50aW1lc3RhbXBGb3JtYXQgfHwgXCJyZmM4MjJcIlxuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzdHJpbmdcIjpcbiAgICAgICAgICBoZWFkZXJzW25hbWVdID0gc2hhcGUuanNvblZhbHVlXG4gICAgICAgICAgICA/IHRoaXMuYmFzZTY0RW5jb2Rlcih0aGlzLnV0ZjhEZWNvZGVyKEpTT04uc3RyaW5naWZ5KGlucHV0KSkpXG4gICAgICAgICAgICA6IGlucHV0O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiaW50ZWdlclwiOlxuICAgICAgICAgIGhlYWRlcnNbbmFtZV0gPSBwYXJzZUludChpbnB1dCkudG9TdHJpbmcoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImZsb2F0XCI6XG4gICAgICAgICAgaGVhZGVyc1tuYW1lXSA9IHBhcnNlRmxvYXQoaW5wdXQpLnRvU3RyaW5nKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJibG9iXCI6IHtcbiAgICAgICAgICBpbnB1dCA9IHR5cGVvZiBpbnB1dCA9PT0gXCJzdHJpbmdcIiA/IHRoaXMudXRmOERlY29kZXIoaW5wdXQpIDogaW5wdXQ7XG4gICAgICAgICAgaGVhZGVyc1tuYW1lXSA9IHRoaXMuYmFzZTY0RW5jb2RlcihpbnB1dCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBoZWFkZXJzW25hbWVdID0gaW5wdXQudG9TdHJpbmcoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVXNlZCB0byBwYXJzZSBtb2RlbGVkIHBhdGhzIHRoYXQgYWxyZWFkeSBpbmNsdWRlIHF1ZXJ5IHN0cmluZ3MuXG4gICAqIERvZXMgbm90IGF0dGVtcHQgdG8gdW5lc2NhcGUgdmFsdWVzLlxuICAgKiBAcGFyYW0gcXVlcnlTdHJpbmdcbiAgICovXG4gIHByaXZhdGUgcGFyc2VRdWVyeVN0cmluZyhcbiAgICBxdWVyeTogUXVlcnlQYXJhbWV0ZXJCYWcsXG4gICAgcXVlcnlTdHJpbmc6IHN0cmluZ1xuICApOiB2b2lkIHtcbiAgICAvLyBnZXQgaW5kaXZpZHVhbCBrZXlzXG4gICAgZm9yIChsZXQga2V5VmFsdWVzIG9mIHF1ZXJ5U3RyaW5nLnNwbGl0KFwiJlwiKSkge1xuICAgICAgY29uc3QgW2tleSwgdmFsdWVdID0ga2V5VmFsdWVzLnNwbGl0KFwiPVwiKTtcbiAgICAgIGlmIChxdWVyeS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHF1ZXJ5W2tleV0pKSB7XG4gICAgICAgICAgKHF1ZXJ5W2tleV0gYXMgc3RyaW5nW10pLnB1c2godmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHF1ZXJ5W2tleV0gPSBbPHN0cmluZz5xdWVyeVtrZXldLCB2YWx1ZV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXJ5W2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGFwaSBwcml2YXRlXG4gICAqXG4gICAqIEFkZCBDb250ZW50LVR5cGUgaGVhZGVyIGZvciByZXN0LWpzb24gcHJvdG9jb2wgZXhwbGljaXRseVxuICAgKiBJZiBwYXlsb2FkIGlzIHN1cHBsaWVkIGluIGlucHV0LCB0aGUgY29udGVudC10eXBlIHNob3VsZCBiZSBzZXQgYWNjb3JkaW5nIHRvIHBheWxvYWQgc2hhcGU7XG4gICAqIElmIHBheWxvYWQgaXMgc3BlY2lmaWVkIGJ1dCBub3Qgc3VwcGxpZWQgaW4gaW5wdXQsIG5vIGNvbnRlbnQtdHlwZSBoZWFkZXIgaXMgbmVlZGVkO1xuICAgKiBJZiB0aGVyZSdzIG5vIHBheWxvYWQgaW4gaW5wdXQgc2hhcGUsIHNldCBjb250ZW50LXR5cGUgYXMgJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgKiBAcGFyYW0gb3BlcmF0aW9uXG4gICAqIEBwYXJhbSBpbnB1dFxuICAgKi9cbiAgcHJpdmF0ZSBwb3B1bGF0ZUNvbnRlbnRUeXBlSGVhZGVyKFxuICAgIG9wZXJhdGlvbjogT3BlcmF0aW9uTW9kZWwsXG4gICAgaW5wdXQ6IGFueVxuICApOiBIZWFkZXJCYWcge1xuICAgIGNvbnN0IGNvbnRlbnRUeXBlSGVhZGVyID0ge307XG4gICAgY29uc3Qge1xuICAgICAgaW5wdXQ6IGlucHV0U2hhcGUsXG4gICAgICBtZXRhZGF0YTogeyBwcm90b2NvbCB9XG4gICAgfSA9IG9wZXJhdGlvbjtcbiAgICBpZiAocHJvdG9jb2wgIT09IFwicmVzdC1qc29uXCIpIHJldHVybiBjb250ZW50VHlwZUhlYWRlcjtcbiAgICBpZiAodHlwZW9mIChpbnB1dFNoYXBlLnNoYXBlIGFzIFN0cnVjdHVyZSkucGF5bG9hZCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgcGF5bG9hZE1lbWJlck5hbWUgPSAoaW5wdXRTaGFwZS5zaGFwZSBhcyBTdHJ1Y3R1cmUpLnBheWxvYWQhO1xuICAgICAgY29uc3QgcGF5bG9hZE1lbWJlciA9IChpbnB1dFNoYXBlLnNoYXBlIGFzIFN0cnVjdHVyZSkubWVtYmVyc1tcbiAgICAgICAgcGF5bG9hZE1lbWJlck5hbWVcbiAgICAgIF07XG4gICAgICBjb25zdCBwYXlsb2FkID0gaW5wdXRbcGF5bG9hZE1lbWJlck5hbWVdO1xuICAgICAgaWYgKCFwYXlsb2FkKSByZXR1cm4gY29udGVudFR5cGVIZWFkZXI7XG4gICAgICBpZiAocGF5bG9hZE1lbWJlci5zaGFwZS50eXBlID09PSBcInN0cnVjdHVyZVwiKSB7XG4gICAgICAgIHJldHVybiB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH07XG4gICAgICB9IGVsc2UgaWYgKHBheWxvYWRNZW1iZXIuc2hhcGUudHlwZSA9PT0gXCJibG9iXCIpIHtcbiAgICAgICAgcmV0dXJuIHsgXCJDb250ZW50LVR5cGVcIjogXCJiaW5hcnkvb2N0ZXQtc3RyZWFtXCIgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRlbnRUeXBlSGVhZGVyO1xuICB9XG59XG4iXX0=

/***/ }),

/***/ 88504:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(9410), exports);
tslib_1.__exportStar(__webpack_require__(78691), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkRBQWlDO0FBQ2pDLHVEQUE2QiIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gXCIuL1Jlc3RTZXJpYWxpemVyXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9SZXN0UGFyc2VyXCI7XG4iXX0=

/***/ }),

/***/ 27949:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function iso8601(time) {
    return toDate(time)
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z");
}
exports.iso8601 = iso8601;
function rfc822(time) {
    return toDate(time).toUTCString();
}
exports.rfc822 = rfc822;
function epoch(time) {
    return Math.floor(toDate(time).valueOf() / 1000);
}
exports.epoch = epoch;
function toDate(time) {
    if (typeof time === "number") {
        return new Date(time * 1000);
    }
    if (typeof time === "string") {
        if (Number(time)) {
            return new Date(Number(time) * 1000);
        }
        return new Date(time);
    }
    return time;
}
exports.toDate = toDate;
function formatTimestamp(time, format) {
    switch (format) {
        case "iso8601":
            return iso8601(time);
        case "rfc822":
            return rfc822(time);
        case "unixTimestamp":
            return epoch(time);
        default:
            throw new Error("Invalid TimestampFormat: " + format);
    }
}
exports.formatTimestamp = formatTimestamp;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 72845:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var util_uri_escape_1 = __webpack_require__(58681);
function buildQueryString(query) {
    var e_1, _a;
    var parts = [];
    try {
        for (var _b = tslib_1.__values(Object.keys(query).sort()), _c = _b.next(); !_c.done; _c = _b.next()) {
            var key = _c.value;
            var value = query[key];
            key = util_uri_escape_1.escapeUri(key);
            if (Array.isArray(value)) {
                for (var i = 0, iLen = value.length; i < iLen; i++) {
                    parts.push(key + "=" + util_uri_escape_1.escapeUri(value[i]));
                }
            }
            else {
                var qsEntry = key;
                if (value || typeof value === "string") {
                    qsEntry += "=" + util_uri_escape_1.escapeUri(value);
                }
                parts.push(qsEntry);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return parts.join("&");
}
exports.buildQueryString = buildQueryString;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 93292:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function parseQueryString(querystring) {
    var e_1, _a;
    var query = {};
    querystring = querystring.replace(/^\?/, "");
    if (querystring) {
        try {
            for (var _b = tslib_1.__values(querystring.split("&")), _c = _b.next(); !_c.done; _c = _b.next()) {
                var pair = _c.value;
                var _d = tslib_1.__read(pair.split("="), 2), key = _d[0], _e = _d[1], value = _e === void 0 ? null : _e;
                key = decodeURIComponent(key);
                if (value) {
                    value = decodeURIComponent(value);
                }
                if (!(key in query)) {
                    query[key] = value;
                }
                else if (Array.isArray(query[key])) {
                    query[key].push(value);
                }
                else {
                    query[key] = [query[key], value];
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    return query;
}
exports.parseQueryString = parseQueryString;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 5215:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var fromEnv_1 = __webpack_require__(86848);
var fromSharedConfigFiles_1 = __webpack_require__(79020);
var property_provider_1 = __webpack_require__(36772);
function defaultProvider(configuration) {
    if (configuration === void 0) { configuration = {}; }
    return property_provider_1.memoize(property_provider_1.chain(fromEnv_1.fromEnv(configuration), fromSharedConfigFiles_1.fromSharedConfigFiles(configuration)));
}
exports.defaultProvider = defaultProvider;
//# sourceMappingURL=defaultProvider.js.map

/***/ }),

/***/ 86848:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var property_provider_1 = __webpack_require__(36772);
exports.ENV_REGION = "AWS_REGION";
function fromEnv(_a) {
    var _this = this;
    var _b = (_a === void 0 ? {} : _a).environmentVariableName, environmentVariableName = _b === void 0 ? exports.ENV_REGION : _b;
    return function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var envRegion;
        return tslib_1.__generator(this, function (_a) {
            envRegion = process.env[environmentVariableName];
            if (envRegion) {
                return [2 /*return*/, envRegion];
            }
            throw new property_provider_1.ProviderError("No value defined for the " + environmentVariableName + " environment variable");
        });
    }); };
}
exports.fromEnv = fromEnv;
//# sourceMappingURL=fromEnv.js.map

/***/ }),

/***/ 79020:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var property_provider_1 = __webpack_require__(36772);
var shared_ini_file_loader_1 = __webpack_require__(14894);
var DEFAULT_PROFILE = "default";
exports.ENV_PROFILE = "AWS_PROFILE";
function fromSharedConfigFiles(init) {
    if (init === void 0) { init = {}; }
    return function () {
        var _a = init.loadedConfig, loadedConfig = _a === void 0 ? shared_ini_file_loader_1.loadSharedConfigFiles(init) : _a, _b = init.profile, profile = _b === void 0 ? process.env[exports.ENV_PROFILE] || DEFAULT_PROFILE : _b;
        return loadedConfig.then(function (_a) {
            var e_1, _b;
            var configFile = _a.configFile, credentialsFile = _a.credentialsFile;
            try {
                for (var _c = tslib_1.__values([credentialsFile, configFile]), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var file = _d.value;
                    var region = (file[profile] || {}).region;
                    if (typeof region === "string") {
                        return region;
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            throw new property_provider_1.ProviderError("No region found for profile " + profile + " in SDK configuration files");
        });
    };
}
exports.fromSharedConfigFiles = fromSharedConfigFiles;
//# sourceMappingURL=fromSharedConfigFiles.js.map

/***/ }),

/***/ 19948:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(5215), exports);
tslib_1.__exportStar(__webpack_require__(86848), exports);
tslib_1.__exportStar(__webpack_require__(79020), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 48881:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var REQUEST_ID_HEADER = "x-amz-request-id";
var REQUEST_ID_ALT_HEADER = "x-amzn-requestid";
var EXTENDED_REQUEST_ID_HEADER = "x-amz-id-2";
var CF_ID_HEADER = "x-amz-cf-id";
function extractMetadata(httpResponse) {
    var httpHeaders = Object.keys(httpResponse.headers).reduce(function (lowercase, headerName) {
        lowercase[headerName.toLowerCase()] = httpResponse.headers[headerName];
        return lowercase;
    }, {});
    return {
        httpHeaders: httpHeaders,
        httpStatusCode: httpResponse.statusCode,
        requestId: httpHeaders[REQUEST_ID_HEADER] || httpHeaders[REQUEST_ID_ALT_HEADER],
        extendedRequestId: httpHeaders[EXTENDED_REQUEST_ID_HEADER],
        cfId: httpHeaders[CF_ID_HEADER]
    };
}
exports.extractMetadata = extractMetadata;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 10056:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * The base number of milliseconds to use in calculating a suitable cool-down
 * time when a retryable error is encountered.
 */
exports.DEFAULT_RETRY_DELAY_BASE = 100;
/**
 * The maximum amount of time (in milliseconds) that will be used as a delay
 * between retry attempts.
 */
exports.MAXIMUM_RETRY_DELAY = 20 * 1000;
/**
 * HTTP status codes that indicate the operation may be retried.
 */
exports.RETRYABLE_STATUS_CODES = new Set();
[429, 500, 502, 503, 504, 509].forEach(function (code) {
    return exports.RETRYABLE_STATUS_CODES.add(code);
});
/**
 * The retry delay base (in milliseconds) to use when a throttling error is
 * encountered.
 */
exports.THROTTLING_RETRY_DELAY_BASE = 500;
//# sourceMappingURL=constants.js.map

/***/ }),

/***/ 53399:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var constants_1 = __webpack_require__(10056);
/**
 * Calculate a capped, fully-jittered exponential backoff time.
 */
function defaultDelayDecider(delayBase, attempts) {
    return Math.floor(Math.min(constants_1.MAXIMUM_RETRY_DELAY, Math.random() * Math.pow(2, attempts) * delayBase));
}
exports.defaultDelayDecider = defaultDelayDecider;
//# sourceMappingURL=delayDecider.js.map

/***/ }),

/***/ 57901:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(53399), exports);
tslib_1.__exportStar(__webpack_require__(2409), exports);
tslib_1.__exportStar(__webpack_require__(93851), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 2409:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var constants_1 = __webpack_require__(10056);
var service_error_classification_1 = __webpack_require__(8826);
function defaultRetryDecider(retryClockSkewErrors) {
    if (retryClockSkewErrors === void 0) { retryClockSkewErrors = false; }
    return function (error) {
        if (!error) {
            return false;
        }
        if (error.connectionError) {
            return true;
        }
        if (hasMetadata(error) &&
            error.$metadata.httpStatusCode &&
            constants_1.RETRYABLE_STATUS_CODES.has(error.$metadata.httpStatusCode)) {
            return true;
        }
        return (service_error_classification_1.isStillProcessingError(error) ||
            service_error_classification_1.isThrottlingError(error) ||
            (retryClockSkewErrors && service_error_classification_1.isClockSkewError(error)));
    };
}
exports.defaultRetryDecider = defaultRetryDecider;
function hasMetadata(error) {
    return error && error.$metadata;
}
//# sourceMappingURL=retryDecider.js.map

/***/ }),

/***/ 93851:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var constants_1 = __webpack_require__(10056);
var delayDecider_1 = __webpack_require__(53399);
var retryDecider_1 = __webpack_require__(2409);
var service_error_classification_1 = __webpack_require__(8826);
function retryMiddleware(maxRetries, retryDecider, delayDecider) {
    if (retryDecider === void 0) { retryDecider = retryDecider_1.defaultRetryDecider(); }
    if (delayDecider === void 0) { delayDecider = delayDecider_1.defaultDelayDecider; }
    return function (next) {
        return function retry(args) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var retries, totalDelay, _loop_1, state_1;
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            retries = 0;
                            totalDelay = 0;
                            _loop_1 = function () {
                                var result, err_1, delay_1;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 5]);
                                            return [4 /*yield*/, next(args)];
                                        case 1:
                                            result = _a.sent();
                                            result.$metadata.retries = retries;
                                            result.$metadata.totalRetryDelay = totalDelay;
                                            return [2 /*return*/, { value: result }];
                                        case 2:
                                            err_1 = _a.sent();
                                            if (!(retries < maxRetries && retryDecider(err_1))) return [3 /*break*/, 4];
                                            delay_1 = delayDecider(service_error_classification_1.isThrottlingError(err_1)
                                                ? constants_1.THROTTLING_RETRY_DELAY_BASE
                                                : constants_1.DEFAULT_RETRY_DELAY_BASE, retries++);
                                            totalDelay += delay_1;
                                            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                        case 3:
                                            _a.sent();
                                            return [2 /*return*/, "continue"];
                                        case 4:
                                            if (!err_1.$metadata) {
                                                err_1.$metadata = {};
                                            }
                                            err_1.$metadata.retries = retries;
                                            err_1.$metadata.totalRetryDelay = totalDelay;
                                            throw err_1;
                                        case 5: return [2 /*return*/];
                                    }
                                });
                            };
                            _a.label = 1;
                        case 1:
                            if (false) {}
                            return [5 /*yield**/, _loop_1()];
                        case 2:
                            state_1 = _a.sent();
                            if (typeof state_1 === "object")
                                return [2 /*return*/, state_1.value];
                            return [3 /*break*/, 1];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
    };
}
exports.retryMiddleware = retryMiddleware;
//# sourceMappingURL=retryMiddleware.js.map

/***/ }),

/***/ 71087:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ERR_RESP_SHAPE = {
    shape: {
        type: "structure",
        required: [],
        members: {
            Code: { shape: { type: "string" } },
            Message: { shape: { type: "string" } }
        }
    }
};
//# sourceMappingURL=constants.js.map

/***/ }),

/***/ 11839:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var constants_1 = __webpack_require__(71087);
var response_metadata_extractor_1 = __webpack_require__(48881);
var util_error_constructor_1 = __webpack_require__(8622);
exports.s3ErrorUnmarshaller = function (operation, input, errorBodyParser) {
    var e_1, _a;
    var body = input.body;
    var errors = operation.errors, operationName = operation.name;
    var _b = parseErrorCommonProperties(errorBodyParser, body), errorName = _b.name, errorMessage = _b.message, requestId = _b.requestId;
    var $metadata = tslib_1.__assign({}, response_metadata_extractor_1.extractMetadata(input), { requestId: requestId });
    if (!errorName) {
        return util_error_constructor_1.initServiceException(new Error(), {
            $metadata: $metadata,
            operationName: operationName
        });
    }
    try {
        //parse error properties from API other than name and message
        for (var errors_1 = tslib_1.__values(errors), errors_1_1 = errors_1.next(); !errors_1_1.done; errors_1_1 = errors_1.next()) {
            var errorShape = errors_1_1.value;
            var errorStructure = errorShape.shape;
            if (errorStructure.exceptionCode === errorName ||
                (!errorStructure.exceptionCode &&
                    errorStructure.exceptionType === errorName)) {
                var rawException = parseErrorOwnProperties(errorShape, body, errorBodyParser);
                return util_error_constructor_1.initServiceException(new Error(), {
                    $metadata: $metadata,
                    name: errorName,
                    message: errorMessage,
                    rawException: rawException,
                    operationName: operationName
                });
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (errors_1_1 && !errors_1_1.done && (_a = errors_1.return)) _a.call(errors_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    //parsable exception but not documented in API
    return util_error_constructor_1.initServiceException(new Error(), {
        $metadata: tslib_1.__assign({}, response_metadata_extractor_1.extractMetadata(input), { requestId: requestId }),
        name: errorName,
        message: errorMessage,
        operationName: operationName
    });
};
function parseErrorOwnProperties(errorShape, body, errorBodyParser) {
    if (!errorShape.shape.members) {
        return {};
    }
    var rawException = errorBodyParser.parse(errorShape, body);
    delete rawException.$metadata;
    return rawException;
}
function parseErrorCommonProperties(errorBodyParser, body) {
    var parsedErrorResponse = errorBodyParser.parse(constants_1.ERR_RESP_SHAPE, body);
    var requestId = parsedErrorResponse.$metadata
        ? parsedErrorResponse.$metadata.requestId
        : undefined;
    if (parsedErrorResponse.Code) {
        var _a = parsedErrorResponse.Code, errorName = _a === void 0 ? undefined : _a, _b = parsedErrorResponse.Message, errorMessage = _b === void 0 ? undefined : _b, requestId_1 = parsedErrorResponse.$metadata.requestId;
        return { name: errorName, message: errorMessage, requestId: requestId_1 };
    }
    return { name: undefined, message: undefined, requestId: requestId };
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 66025:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Errors encountered when the client clock and server clock cannot agree on the
 * current time.
 *
 * These errors are retryable, assuming the SDK has enabled clock skew
 * correction.
 */
exports.CLOCK_SKEW_ERROR_CODES = {
    AuthFailure: true,
    InvalidSignatureException: true,
    RequestExpired: true,
    RequestInTheFuture: true,
    RequestTimeTooSkewed: true,
    SignatureDoesNotMatch: true
};
/**
 * Errors encountered when the state presumed by an operation is not yet ready.
 */
exports.STILL_PROCESSING_ERROR_CODES = {
    PriorRequestNotComplete: true
};
/**
 * Errors that indicate the SDK is being throttled.
 *
 * These errors are always retryable.
 */
exports.THROTTLING_ERROR_CODES = {
    BandwidthLimitExceeded: true,
    ProvisionedThroughputExceededException: true,
    RequestLimitExceeded: true,
    RequestThrottled: true,
    RequestThrottledException: true,
    SlowDown: true,
    ThrottledException: true,
    Throttling: true,
    ThrottlingException: true,
    TooManyRequestsException: true
};
//# sourceMappingURL=constants.js.map

/***/ }),

/***/ 8826:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var constants_1 = __webpack_require__(66025);
function isClockSkewError(error) {
    return error.name in constants_1.CLOCK_SKEW_ERROR_CODES;
}
exports.isClockSkewError = isClockSkewError;
function isStillProcessingError(error) {
    return error.name in constants_1.STILL_PROCESSING_ERROR_CODES;
}
exports.isStillProcessingError = isStillProcessingError;
function isThrottlingError(error) {
    return error.name in constants_1.THROTTLING_ERROR_CODES;
}
exports.isThrottlingError = isThrottlingError;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 14894:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var os_1 = __webpack_require__(12087);
var path_1 = __webpack_require__(85622);
var fs_1 = __webpack_require__(35747);
exports.ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
exports.ENV_CONFIG_PATH = "AWS_CONFIG_FILE";
var swallowError = function () { return ({}); };
function loadSharedConfigFiles(init) {
    if (init === void 0) { init = {}; }
    var _a = init.filepath, filepath = _a === void 0 ? process.env[exports.ENV_CREDENTIALS_PATH] ||
        path_1.join(getHomeDir(), ".aws", "credentials") : _a, _b = init.configFilepath, configFilepath = _b === void 0 ? process.env[exports.ENV_CONFIG_PATH] ||
        path_1.join(getHomeDir(), ".aws", "config") : _b;
    return Promise.all([
        slurpFile(configFilepath)
            .then(parseIni)
            .then(normalizeConfigFile)
            .catch(swallowError),
        slurpFile(filepath)
            .then(parseIni)
            .catch(swallowError)
    ]).then(function (parsedFiles) {
        var configFile = parsedFiles[0], credentialsFile = parsedFiles[1];
        return {
            configFile: configFile,
            credentialsFile: credentialsFile
        };
    });
}
exports.loadSharedConfigFiles = loadSharedConfigFiles;
var profileKeyRegex = /^profile\s(["'])?([^\1]+)\1$/;
function normalizeConfigFile(data) {
    var map = {};
    for (var _i = 0, _a = Object.keys(data); _i < _a.length; _i++) {
        var key = _a[_i];
        var matches = void 0;
        if (key === "default") {
            map.default = data.default;
        }
        else if ((matches = profileKeyRegex.exec(key))) {
            var _1 = matches[0], _2 = matches[1], normalizedKey = matches[2];
            if (normalizedKey) {
                map[normalizedKey] = data[key];
            }
        }
    }
    return map;
}
function parseIni(iniData) {
    var map = {};
    var currentSection;
    for (var _i = 0, _a = iniData.split(/\r?\n/); _i < _a.length; _i++) {
        var line = _a[_i];
        line = line.split(/(^|\s)[;#]/)[0]; // remove comments
        var section = line.match(/^\s*\[([^\[\]]+)]\s*$/);
        if (section) {
            currentSection = section[1];
        }
        else if (currentSection) {
            var item = line.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
            if (item) {
                map[currentSection] = map[currentSection] || {};
                map[currentSection][item[1]] = item[2];
            }
        }
    }
    return map;
}
function slurpFile(path) {
    return new Promise(function (resolve, reject) {
        fs_1.readFile(path, "utf8", function (err, data) {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    });
}
function getHomeDir() {
    var _a = process.env, HOME = _a.HOME, USERPROFILE = _a.USERPROFILE, HOMEPATH = _a.HOMEPATH, _b = _a.HOMEDRIVE, HOMEDRIVE = _b === void 0 ? "C:" + path_1.sep : _b;
    if (HOME)
        return HOME;
    if (USERPROFILE)
        return USERPROFILE;
    if (HOMEPATH)
        return "" + HOMEDRIVE + HOMEPATH;
    return os_1.homedir();
}
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 21439:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(75636);
const credentialDerivation_1 = __webpack_require__(27639);
const getCanonicalHeaders_1 = __webpack_require__(24628);
const getCanonicalQuery_1 = __webpack_require__(36013);
const getPayloadHash_1 = __webpack_require__(466);
const prepareRequest_1 = __webpack_require__(5475);
const moveHeadersToQuery_1 = __webpack_require__(16764);
const constants_1 = __webpack_require__(13248);
const protocol_timestamp_1 = __webpack_require__(27949);
const util_hex_encoding_1 = __webpack_require__(72155);
const hasHeader_1 = __webpack_require__(36725);
class SignatureV4 {
    constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath = true }) {
        this.service = service;
        this.sha256 = sha256;
        this.uriEscapePath = uriEscapePath;
        // default to true if applyChecksum isn't set
        this.applyChecksum =
            typeof applyChecksum === "boolean" ? applyChecksum : true;
        if (typeof region === "string") {
            const promisified = Promise.resolve(region);
            this.regionProvider = () => promisified;
        }
        else {
            this.regionProvider = region;
        }
        if (typeof credentials === "object") {
            const promisified = Promise.resolve(credentials);
            this.credentialProvider = () => promisified;
        }
        else {
            this.credentialProvider = credentials;
        }
    }
    async presignRequest(originalRequest, expiration, options = {}) {
        const [region, credentials] = await Promise.all([
            this.regionProvider(),
            this.credentialProvider()
        ]);
        const { signingDate = new Date(), unsignableHeaders, signableHeaders } = options;
        const { longDate, shortDate } = formatDate(signingDate);
        const ttl = getTtl(signingDate, expiration);
        if (ttl > constants_1.MAX_PRESIGNED_TTL) {
            return Promise.reject("Signature version 4 presigned URLs" +
                " must have an expiration date less than one week in" +
                " the future");
        }
        const scope = credentialDerivation_1.createScope(shortDate, region, this.service);
        const request = moveHeadersToQuery_1.moveHeadersToQuery(prepareRequest_1.prepareRequest(originalRequest));
        if (credentials.sessionToken) {
            request.query[constants_1.TOKEN_QUERY_PARAM] = credentials.sessionToken;
        }
        request.query[constants_1.ALGORITHM_QUERY_PARAM] = constants_1.ALGORITHM_IDENTIFIER;
        request.query[constants_1.CREDENTIAL_QUERY_PARAM] = `${credentials.accessKeyId}/${scope}`;
        request.query[constants_1.AMZ_DATE_QUERY_PARAM] = longDate;
        request.query[constants_1.EXPIRES_QUERY_PARAM] = ttl.toString(10);
        const canonicalHeaders = getCanonicalHeaders_1.getCanonicalHeaders(request, unsignableHeaders, signableHeaders);
        request.query[constants_1.SIGNED_HEADERS_QUERY_PARAM] = getCanonicalHeaderList(canonicalHeaders);
        request.query[constants_1.SIGNATURE_QUERY_PARAM] = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate), this.createCanonicalRequest(request, canonicalHeaders, await getPayloadHash_1.getPayloadHash(originalRequest, this.sha256)));
        return request;
    }
    async sign(toSign, _a = {}) {
        var { signingDate = new Date() } = _a, options = tslib_1.__rest(_a, ["signingDate"]);
        const [region, credentials] = await Promise.all([
            this.regionProvider(),
            this.credentialProvider()
        ]);
        if (typeof toSign === "string") {
            return this.signString(toSign, signingDate, region, credentials);
        }
        else {
            const { unsignableHeaders, signableHeaders } = options;
            return this.signRequest(toSign, signingDate, region, credentials, unsignableHeaders, signableHeaders);
        }
    }
    async signString(stringToSign, signingDate, region, credentials) {
        const { shortDate } = formatDate(signingDate);
        const hash = new this.sha256(await this.getSigningKey(credentials, region, shortDate));
        hash.update(stringToSign);
        return util_hex_encoding_1.toHex(await hash.digest());
    }
    async signRequest(originalRequest, signingDate, region, credentials, unsignableHeaders, signableHeaders) {
        const request = prepareRequest_1.prepareRequest(originalRequest);
        const { longDate, shortDate } = formatDate(signingDate);
        const scope = credentialDerivation_1.createScope(shortDate, region, this.service);
        request.headers[constants_1.AMZ_DATE_HEADER] = longDate;
        if (credentials.sessionToken) {
            request.headers[constants_1.TOKEN_HEADER] = credentials.sessionToken;
        }
        const payloadHash = await getPayloadHash_1.getPayloadHash(request, this.sha256);
        if (!hasHeader_1.hasHeader(constants_1.SHA256_HEADER, request.headers) && this.applyChecksum) {
            request.headers[constants_1.SHA256_HEADER] = payloadHash;
        }
        const canonicalHeaders = getCanonicalHeaders_1.getCanonicalHeaders(request, unsignableHeaders, signableHeaders);
        const signature = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate), this.createCanonicalRequest(request, canonicalHeaders, payloadHash));
        request.headers[constants_1.AUTH_HEADER] =
            `${constants_1.ALGORITHM_IDENTIFIER} ` +
                `Credential=${credentials.accessKeyId}/${scope}, ` +
                `SignedHeaders=${getCanonicalHeaderList(canonicalHeaders)}, ` +
                `Signature=${signature}`;
        return request;
    }
    createCanonicalRequest(request, canonicalHeaders, payloadHash) {
        const sortedHeaders = Object.keys(canonicalHeaders).sort();
        return `${request.method}
${this.getCanonicalPath(request)}
${getCanonicalQuery_1.getCanonicalQuery(request)}
${sortedHeaders.map(name => `${name}:${canonicalHeaders[name]}`).join("\n")}

${sortedHeaders.join(";")}
${payloadHash}`;
    }
    async createStringToSign(longDate, credentialScope, canonicalRequest) {
        const hash = new this.sha256();
        hash.update(canonicalRequest);
        const hashedRequest = await hash.digest();
        return `${constants_1.ALGORITHM_IDENTIFIER}
${longDate}
${credentialScope}
${util_hex_encoding_1.toHex(hashedRequest)}`;
    }
    getCanonicalPath({ path }) {
        if (this.uriEscapePath) {
            const doubleEncoded = encodeURIComponent(path.replace(/^\//, ""));
            return `/${doubleEncoded.replace(/%2F/g, "/")}`;
        }
        return path;
    }
    async getSignature(longDate, credentialScope, keyPromise, canonicalRequest) {
        const stringToSign = await this.createStringToSign(longDate, credentialScope, canonicalRequest);
        const hash = new this.sha256(await keyPromise);
        hash.update(stringToSign);
        return util_hex_encoding_1.toHex(await hash.digest());
    }
    getSigningKey(credentials, region, shortDate) {
        return credentialDerivation_1.getSigningKey(this.sha256, credentials, shortDate, region, this.service);
    }
}
exports.SignatureV4 = SignatureV4;
function formatDate(now) {
    const longDate = protocol_timestamp_1.iso8601(now).replace(/[\-:]/g, "");
    return {
        longDate,
        shortDate: longDate.substr(0, 8)
    };
}
function getCanonicalHeaderList(headers) {
    return Object.keys(headers)
        .sort()
        .join(";");
}
function getTtl(start, expiration) {
    return Math.floor((protocol_timestamp_1.toDate(expiration).valueOf() - protocol_timestamp_1.toDate(start).valueOf()) / 1000);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2lnbmF0dXJlVjQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU2lnbmF0dXJlVjQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUVBQW9FO0FBQ3BFLCtEQUE0RDtBQUM1RCwyREFBd0Q7QUFDeEQscURBQWtEO0FBQ2xELHFEQUFrRDtBQUNsRCw2REFBMEQ7QUFDMUQsMkNBY3FCO0FBY3JCLG9FQUE4RDtBQUM5RCxrRUFBbUQ7QUFDbkQsMkNBQXdDO0FBa0R4QyxNQUFhLFdBQVc7SUFTdEIsWUFBWSxFQUNWLGFBQWEsRUFDYixXQUFXLEVBQ1gsTUFBTSxFQUNOLE9BQU8sRUFDUCxNQUFNLEVBQ04sYUFBYSxHQUFHLElBQUksRUFDb0I7UUFDeEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsNkNBQTZDO1FBQzdDLElBQUksQ0FBQyxhQUFhO1lBQ2hCLE9BQU8sYUFBYSxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFFNUQsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDOUIsTUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM1QyxJQUFJLENBQUMsY0FBYyxHQUFHLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQztTQUN6QzthQUFNO1lBQ0wsSUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUM7U0FDOUI7UUFFRCxJQUFJLE9BQU8sV0FBVyxLQUFLLFFBQVEsRUFBRTtZQUNuQyxNQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxXQUFXLENBQUM7U0FDN0M7YUFBTTtZQUNMLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxXQUFXLENBQUM7U0FDdkM7SUFDSCxDQUFDO0lBRU0sS0FBSyxDQUFDLGNBQWMsQ0FDekIsZUFBd0MsRUFDeEMsVUFBcUIsRUFDckIsVUFBbUMsRUFBRTtRQUVyQyxNQUFNLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUM5QyxJQUFJLENBQUMsY0FBYyxFQUFFO1lBQ3JCLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtTQUMxQixDQUFDLENBQUM7UUFFSCxNQUFNLEVBQ0osV0FBVyxHQUFHLElBQUksSUFBSSxFQUFFLEVBQ3hCLGlCQUFpQixFQUNqQixlQUFlLEVBQ2hCLEdBQUcsT0FBTyxDQUFDO1FBRVosTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM1QyxJQUFJLEdBQUcsR0FBRyw2QkFBaUIsRUFBRTtZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQ25CLG9DQUFvQztnQkFDbEMscURBQXFEO2dCQUNyRCxhQUFhLENBQ2hCLENBQUM7U0FDSDtRQUVELE1BQU0sS0FBSyxHQUFHLGtDQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0QsTUFBTSxPQUFPLEdBQUcsdUNBQWtCLENBQUMsK0JBQWMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBRXBFLElBQUksV0FBVyxDQUFDLFlBQVksRUFBRTtZQUM1QixPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUFpQixDQUFDLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztTQUM3RDtRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQXFCLENBQUMsR0FBRyxnQ0FBb0IsQ0FBQztRQUM1RCxPQUFPLENBQUMsS0FBSyxDQUNYLGtDQUFzQixDQUN2QixHQUFHLEdBQUcsV0FBVyxDQUFDLFdBQVcsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUMxQyxPQUFPLENBQUMsS0FBSyxDQUFDLGdDQUFvQixDQUFDLEdBQUcsUUFBUSxDQUFDO1FBQy9DLE9BQU8sQ0FBQyxLQUFLLENBQUMsK0JBQW1CLENBQUMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXRELE1BQU0sZ0JBQWdCLEdBQUcseUNBQW1CLENBQzFDLE9BQU8sRUFDUCxpQkFBaUIsRUFDakIsZUFBZSxDQUNoQixDQUFDO1FBQ0YsT0FBTyxDQUFDLEtBQUssQ0FBQyxzQ0FBMEIsQ0FBQyxHQUFHLHNCQUFzQixDQUNoRSxnQkFBZ0IsQ0FDakIsQ0FBQztRQUVGLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQXFCLENBQUMsR0FBRyxNQUFNLElBQUksQ0FBQyxZQUFZLENBQzVELFFBQVEsRUFDUixLQUFLLEVBQ0wsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxFQUNsRCxJQUFJLENBQUMsc0JBQXNCLENBQ3pCLE9BQU8sRUFDUCxnQkFBZ0IsRUFDaEIsTUFBTSwrQkFBYyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQ25ELENBQ0YsQ0FBQztRQUVGLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFVTSxLQUFLLENBQUMsSUFBSSxDQUNmLE1BQVMsRUFDVCxLQUdnRCxFQUFFO1lBSGxELEVBQ0UsV0FBVyxHQUFHLElBQUksSUFBSSxFQUFFLE9BRXdCLEVBRGhELDZDQUFVO1FBR1osTUFBTSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDOUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUNyQixJQUFJLENBQUMsa0JBQWtCLEVBQUU7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxPQUFPLE1BQU0sS0FBSyxRQUFRLEVBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUNwQixNQUFNLEVBQ04sV0FBVyxFQUNYLE1BQU0sRUFDTixXQUFXLENBQ0UsQ0FBQztTQUNqQjthQUFNO1lBQ0wsTUFBTSxFQUNKLGlCQUFpQixFQUNqQixlQUFlLEVBQ2hCLEdBQUcsT0FBa0MsQ0FBQztZQUV2QyxPQUFPLElBQUksQ0FBQyxXQUFXLENBQ3JCLE1BQTBCLEVBQzFCLFdBQVcsRUFDWCxNQUFNLEVBQ04sV0FBVyxFQUNYLGlCQUFpQixFQUNqQixlQUFlLENBQ0YsQ0FBQztTQUNqQjtJQUNILENBQUM7SUFFTyxLQUFLLENBQUMsVUFBVSxDQUN0QixZQUFvQixFQUNwQixXQUFzQixFQUN0QixNQUFjLEVBQ2QsV0FBd0I7UUFFeEIsTUFBTSxFQUFFLFNBQVMsRUFBRSxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUU5QyxNQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQzFCLE1BQU0sSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUN6RCxDQUFDO1FBQ0YsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxQixPQUFPLHlCQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRU8sS0FBSyxDQUFDLFdBQVcsQ0FDdkIsZUFBaUMsRUFDakMsV0FBc0IsRUFDdEIsTUFBYyxFQUNkLFdBQXdCLEVBQ3hCLGlCQUErQixFQUMvQixlQUE2QjtRQUU3QixNQUFNLE9BQU8sR0FBRywrQkFBYyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEdBQUcsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sS0FBSyxHQUFHLGtDQUFXLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFM0QsT0FBTyxDQUFDLE9BQU8sQ0FBQywyQkFBZSxDQUFDLEdBQUcsUUFBUSxDQUFDO1FBQzVDLElBQUksV0FBVyxDQUFDLFlBQVksRUFBRTtZQUM1QixPQUFPLENBQUMsT0FBTyxDQUFDLHdCQUFZLENBQUMsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDO1NBQzFEO1FBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSwrQkFBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDL0QsSUFBSSxDQUFDLHFCQUFTLENBQUMseUJBQWEsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUNwRSxPQUFPLENBQUMsT0FBTyxDQUFDLHlCQUFhLENBQUMsR0FBRyxXQUFXLENBQUM7U0FDOUM7UUFFRCxNQUFNLGdCQUFnQixHQUFHLHlDQUFtQixDQUMxQyxPQUFPLEVBQ1AsaUJBQWlCLEVBQ2pCLGVBQWUsQ0FDaEIsQ0FBQztRQUNGLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDLFlBQVksQ0FDdkMsUUFBUSxFQUNSLEtBQUssRUFDTCxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLEVBQ2xELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLENBQ3BFLENBQUM7UUFFRixPQUFPLENBQUMsT0FBTyxDQUFDLHVCQUFXLENBQUM7WUFDMUIsR0FBRyxnQ0FBb0IsR0FBRztnQkFDMUIsY0FBYyxXQUFXLENBQUMsV0FBVyxJQUFJLEtBQUssSUFBSTtnQkFDbEQsaUJBQWlCLHNCQUFzQixDQUFDLGdCQUFnQixDQUFDLElBQUk7Z0JBQzdELGFBQWEsU0FBUyxFQUFFLENBQUM7UUFFM0IsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVPLHNCQUFzQixDQUM1QixPQUF5QixFQUN6QixnQkFBMkIsRUFDM0IsV0FBbUI7UUFFbkIsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzNELE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTTtFQUMxQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDO0VBQzlCLHFDQUFpQixDQUFDLE9BQU8sQ0FBQztFQUMxQixhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7O0VBRXpFLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO0VBQ3ZCLFdBQVcsRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUVPLEtBQUssQ0FBQyxrQkFBa0IsQ0FDOUIsUUFBZ0IsRUFDaEIsZUFBdUIsRUFDdkIsZ0JBQXdCO1FBRXhCLE1BQU0sSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQy9CLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUM5QixNQUFNLGFBQWEsR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUUxQyxPQUFPLEdBQUcsZ0NBQW9CO0VBQ2hDLFFBQVE7RUFDUixlQUFlO0VBQ2YseUJBQUssQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFTyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBb0I7UUFDakQsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLE1BQU0sYUFBYSxHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbEUsT0FBTyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7U0FDakQ7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTyxLQUFLLENBQUMsWUFBWSxDQUN4QixRQUFnQixFQUNoQixlQUF1QixFQUN2QixVQUErQixFQUMvQixnQkFBd0I7UUFFeEIsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQ2hELFFBQVEsRUFDUixlQUFlLEVBQ2YsZ0JBQWdCLENBQ2pCLENBQUM7UUFFRixNQUFNLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxVQUFVLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQzFCLE9BQU8seUJBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTyxhQUFhLENBQ25CLFdBQXdCLEVBQ3hCLE1BQWMsRUFDZCxTQUFpQjtRQUVqQixPQUFPLG9DQUFhLENBQ2xCLElBQUksQ0FBQyxNQUFNLEVBQ1gsV0FBVyxFQUNYLFNBQVMsRUFDVCxNQUFNLEVBQ04sSUFBSSxDQUFDLE9BQU8sQ0FDYixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBaFJELGtDQWdSQztBQUVELFNBQVMsVUFBVSxDQUFDLEdBQWM7SUFDaEMsTUFBTSxRQUFRLEdBQUcsNEJBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ3BELE9BQU87UUFDTCxRQUFRO1FBQ1IsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUNqQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsc0JBQXNCLENBQUMsT0FBZTtJQUM3QyxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3hCLElBQUksRUFBRTtTQUNOLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLE1BQU0sQ0FBQyxLQUFnQixFQUFFLFVBQXFCO0lBQ3JELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FDZixDQUFDLDJCQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsMkJBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FDaEUsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVTY29wZSwgZ2V0U2lnbmluZ0tleSB9IGZyb20gXCIuL2NyZWRlbnRpYWxEZXJpdmF0aW9uXCI7XG5pbXBvcnQgeyBnZXRDYW5vbmljYWxIZWFkZXJzIH0gZnJvbSBcIi4vZ2V0Q2Fub25pY2FsSGVhZGVyc1wiO1xuaW1wb3J0IHsgZ2V0Q2Fub25pY2FsUXVlcnkgfSBmcm9tIFwiLi9nZXRDYW5vbmljYWxRdWVyeVwiO1xuaW1wb3J0IHsgZ2V0UGF5bG9hZEhhc2ggfSBmcm9tIFwiLi9nZXRQYXlsb2FkSGFzaFwiO1xuaW1wb3J0IHsgcHJlcGFyZVJlcXVlc3QgfSBmcm9tIFwiLi9wcmVwYXJlUmVxdWVzdFwiO1xuaW1wb3J0IHsgbW92ZUhlYWRlcnNUb1F1ZXJ5IH0gZnJvbSBcIi4vbW92ZUhlYWRlcnNUb1F1ZXJ5XCI7XG5pbXBvcnQge1xuICBBTEdPUklUSE1fSURFTlRJRklFUixcbiAgQUxHT1JJVEhNX1FVRVJZX1BBUkFNLFxuICBBTVpfREFURV9IRUFERVIsXG4gIEFNWl9EQVRFX1FVRVJZX1BBUkFNLFxuICBBVVRIX0hFQURFUixcbiAgQ1JFREVOVElBTF9RVUVSWV9QQVJBTSxcbiAgRVhQSVJFU19RVUVSWV9QQVJBTSxcbiAgTUFYX1BSRVNJR05FRF9UVEwsXG4gIFNIQTI1Nl9IRUFERVIsXG4gIFNJR05BVFVSRV9RVUVSWV9QQVJBTSxcbiAgU0lHTkVEX0hFQURFUlNfUVVFUllfUEFSQU0sXG4gIFRPS0VOX0hFQURFUixcbiAgVE9LRU5fUVVFUllfUEFSQU1cbn0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5pbXBvcnQge1xuICBDcmVkZW50aWFscyxcbiAgRGF0ZUlucHV0LFxuICBIYXNoQ29uc3RydWN0b3IsXG4gIEhlYWRlckJhZyxcbiAgSHR0cFJlcXVlc3QsXG4gIFByb3ZpZGVyLFxuICBSZXF1ZXN0UHJlc2lnbmVyLFxuICBSZXF1ZXN0U2lnbmVyLFxuICBSZXF1ZXN0U2lnbmluZ0FyZ3VtZW50cyxcbiAgU2lnbmluZ0FyZ3VtZW50cyxcbiAgU3RyaW5nU2lnbmVyXG59IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuaW1wb3J0IHsgaXNvODYwMSwgdG9EYXRlIH0gZnJvbSBcIkBhd3Mtc2RrL3Byb3RvY29sLXRpbWVzdGFtcFwiO1xuaW1wb3J0IHsgdG9IZXggfSBmcm9tIFwiQGF3cy1zZGsvdXRpbC1oZXgtZW5jb2RpbmdcIjtcbmltcG9ydCB7IGhhc0hlYWRlciB9IGZyb20gXCIuL2hhc0hlYWRlclwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25hdHVyZVY0SW5pdCB7XG4gIC8qKlxuICAgKiBUaGUgc2VydmljZSBzaWduaW5nIG5hbWUuXG4gICAqL1xuICBzZXJ2aWNlOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSByZWdpb24gbmFtZSBvciBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhIHByb21pc2UgdGhhdCB3aWxsIGJlXG4gICAqIHJlc29sdmVkIHdpdGggdGhlIHJlZ2lvbiBuYW1lLlxuICAgKi9cbiAgcmVnaW9uOiBzdHJpbmcgfCBQcm92aWRlcjxzdHJpbmc+O1xuXG4gIC8qKlxuICAgKiBUaGUgY3JlZGVudGlhbHMgd2l0aCB3aGljaCB0aGUgcmVxdWVzdCBzaG91bGQgYmUgc2lnbmVkIG9yIGEgZnVuY3Rpb25cbiAgICogdGhhdCByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgcmVzb2x2ZWQgd2l0aCBjcmVkZW50aWFscy5cbiAgICovXG4gIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyB8IFByb3ZpZGVyPENyZWRlbnRpYWxzPjtcblxuICAvKipcbiAgICogQSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgYSBoYXNoIG9iamVjdCB0aGF0IHdpbGwgY2FsY3VsYXRlIFNIQS0yNTYgSE1BQ1xuICAgKiBjaGVja3N1bXMuXG4gICAqL1xuICBzaGEyNTY/OiBIYXNoQ29uc3RydWN0b3I7XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gdXJpLWVzY2FwZSB0aGUgcmVxdWVzdCBVUkkgcGF0aCBhcyBwYXJ0IG9mIGNvbXB1dGluZyB0aGVcbiAgICogY2Fub25pY2FsIHJlcXVlc3Qgc3RyaW5nLiBUaGlzIGlzIHJlcXVpcmVkIGZvciBldmVyeSBBV1Mgc2VydmljZSwgZXhjZXB0XG4gICAqIEFtYXpvbiBTMywgYXMgb2YgbGF0ZSAyMDE3LlxuICAgKlxuICAgKiBAZGVmYXVsdCBbdHJ1ZV1cbiAgICovXG4gIHVyaUVzY2FwZVBhdGg/OiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGNhbGN1bGF0ZSBhIGNoZWNrc3VtIG9mIHRoZSByZXF1ZXN0IGJvZHkgYW5kIGluY2x1ZGUgaXQgYXNcbiAgICogZWl0aGVyIGEgcmVxdWVzdCBoZWFkZXIgKHdoZW4gc2lnbmluZykgb3IgYXMgYSBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyXG4gICAqICh3aGVuIHByZXNpZ25pbmcpLiBUaGlzIGlzIHJlcXVpcmVkIGZvciBBV1MgR2xhY2llciBhbmQgQW1hem9uIFMzIGFuZCBvcHRpb25hbCBmb3JcbiAgICogZXZlcnkgb3RoZXIgQVdTIHNlcnZpY2UgYXMgb2YgbGF0ZSAyMDE3LlxuICAgKlxuICAgKiBAZGVmYXVsdCBbdHJ1ZV1cbiAgICovXG4gIGFwcGx5Q2hlY2tzdW0/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25hdHVyZVY0Q3J5cHRvSW5pdCB7XG4gIHNoYTI1NjogSGFzaENvbnN0cnVjdG9yO1xufVxuXG5leHBvcnQgY2xhc3MgU2lnbmF0dXJlVjRcbiAgaW1wbGVtZW50cyBSZXF1ZXN0UHJlc2lnbmVyLCBSZXF1ZXN0U2lnbmVyLCBTdHJpbmdTaWduZXIge1xuICBwcml2YXRlIHJlYWRvbmx5IHNlcnZpY2U6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSByZWdpb25Qcm92aWRlcjogUHJvdmlkZXI8c3RyaW5nPjtcbiAgcHJpdmF0ZSByZWFkb25seSBjcmVkZW50aWFsUHJvdmlkZXI6IFByb3ZpZGVyPENyZWRlbnRpYWxzPjtcbiAgcHJpdmF0ZSByZWFkb25seSBzaGEyNTY6IEhhc2hDb25zdHJ1Y3RvcjtcbiAgcHJpdmF0ZSByZWFkb25seSB1cmlFc2NhcGVQYXRoOiBib29sZWFuO1xuICBwcml2YXRlIHJlYWRvbmx5IGFwcGx5Q2hlY2tzdW06IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3Ioe1xuICAgIGFwcGx5Q2hlY2tzdW0sXG4gICAgY3JlZGVudGlhbHMsXG4gICAgcmVnaW9uLFxuICAgIHNlcnZpY2UsXG4gICAgc2hhMjU2LFxuICAgIHVyaUVzY2FwZVBhdGggPSB0cnVlXG4gIH06IFNpZ25hdHVyZVY0SW5pdCAmIFNpZ25hdHVyZVY0Q3J5cHRvSW5pdCkge1xuICAgIHRoaXMuc2VydmljZSA9IHNlcnZpY2U7XG4gICAgdGhpcy5zaGEyNTYgPSBzaGEyNTY7XG4gICAgdGhpcy51cmlFc2NhcGVQYXRoID0gdXJpRXNjYXBlUGF0aDtcbiAgICAvLyBkZWZhdWx0IHRvIHRydWUgaWYgYXBwbHlDaGVja3N1bSBpc24ndCBzZXRcbiAgICB0aGlzLmFwcGx5Q2hlY2tzdW0gPVxuICAgICAgdHlwZW9mIGFwcGx5Q2hlY2tzdW0gPT09IFwiYm9vbGVhblwiID8gYXBwbHlDaGVja3N1bSA6IHRydWU7XG5cbiAgICBpZiAodHlwZW9mIHJlZ2lvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc3QgcHJvbWlzaWZpZWQgPSBQcm9taXNlLnJlc29sdmUocmVnaW9uKTtcbiAgICAgIHRoaXMucmVnaW9uUHJvdmlkZXIgPSAoKSA9PiBwcm9taXNpZmllZDtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5yZWdpb25Qcm92aWRlciA9IHJlZ2lvbjtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIGNyZWRlbnRpYWxzID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBjb25zdCBwcm9taXNpZmllZCA9IFByb21pc2UucmVzb2x2ZShjcmVkZW50aWFscyk7XG4gICAgICB0aGlzLmNyZWRlbnRpYWxQcm92aWRlciA9ICgpID0+IHByb21pc2lmaWVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNyZWRlbnRpYWxQcm92aWRlciA9IGNyZWRlbnRpYWxzO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBhc3luYyBwcmVzaWduUmVxdWVzdDxTdHJlYW1UeXBlPihcbiAgICBvcmlnaW5hbFJlcXVlc3Q6IEh0dHBSZXF1ZXN0PFN0cmVhbVR5cGU+LFxuICAgIGV4cGlyYXRpb246IERhdGVJbnB1dCxcbiAgICBvcHRpb25zOiBSZXF1ZXN0U2lnbmluZ0FyZ3VtZW50cyA9IHt9XG4gICk6IFByb21pc2U8SHR0cFJlcXVlc3Q8U3RyZWFtVHlwZT4+IHtcbiAgICBjb25zdCBbcmVnaW9uLCBjcmVkZW50aWFsc10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICB0aGlzLnJlZ2lvblByb3ZpZGVyKCksXG4gICAgICB0aGlzLmNyZWRlbnRpYWxQcm92aWRlcigpXG4gICAgXSk7XG5cbiAgICBjb25zdCB7XG4gICAgICBzaWduaW5nRGF0ZSA9IG5ldyBEYXRlKCksXG4gICAgICB1bnNpZ25hYmxlSGVhZGVycyxcbiAgICAgIHNpZ25hYmxlSGVhZGVyc1xuICAgIH0gPSBvcHRpb25zO1xuXG4gICAgY29uc3QgeyBsb25nRGF0ZSwgc2hvcnREYXRlIH0gPSBmb3JtYXREYXRlKHNpZ25pbmdEYXRlKTtcbiAgICBjb25zdCB0dGwgPSBnZXRUdGwoc2lnbmluZ0RhdGUsIGV4cGlyYXRpb24pO1xuICAgIGlmICh0dGwgPiBNQVhfUFJFU0lHTkVEX1RUTCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICBcIlNpZ25hdHVyZSB2ZXJzaW9uIDQgcHJlc2lnbmVkIFVSTHNcIiArXG4gICAgICAgICAgXCIgbXVzdCBoYXZlIGFuIGV4cGlyYXRpb24gZGF0ZSBsZXNzIHRoYW4gb25lIHdlZWsgaW5cIiArXG4gICAgICAgICAgXCIgdGhlIGZ1dHVyZVwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHNjb3BlID0gY3JlYXRlU2NvcGUoc2hvcnREYXRlLCByZWdpb24sIHRoaXMuc2VydmljZSk7XG4gICAgY29uc3QgcmVxdWVzdCA9IG1vdmVIZWFkZXJzVG9RdWVyeShwcmVwYXJlUmVxdWVzdChvcmlnaW5hbFJlcXVlc3QpKTtcblxuICAgIGlmIChjcmVkZW50aWFscy5zZXNzaW9uVG9rZW4pIHtcbiAgICAgIHJlcXVlc3QucXVlcnlbVE9LRU5fUVVFUllfUEFSQU1dID0gY3JlZGVudGlhbHMuc2Vzc2lvblRva2VuO1xuICAgIH1cbiAgICByZXF1ZXN0LnF1ZXJ5W0FMR09SSVRITV9RVUVSWV9QQVJBTV0gPSBBTEdPUklUSE1fSURFTlRJRklFUjtcbiAgICByZXF1ZXN0LnF1ZXJ5W1xuICAgICAgQ1JFREVOVElBTF9RVUVSWV9QQVJBTVxuICAgIF0gPSBgJHtjcmVkZW50aWFscy5hY2Nlc3NLZXlJZH0vJHtzY29wZX1gO1xuICAgIHJlcXVlc3QucXVlcnlbQU1aX0RBVEVfUVVFUllfUEFSQU1dID0gbG9uZ0RhdGU7XG4gICAgcmVxdWVzdC5xdWVyeVtFWFBJUkVTX1FVRVJZX1BBUkFNXSA9IHR0bC50b1N0cmluZygxMCk7XG5cbiAgICBjb25zdCBjYW5vbmljYWxIZWFkZXJzID0gZ2V0Q2Fub25pY2FsSGVhZGVycyhcbiAgICAgIHJlcXVlc3QsXG4gICAgICB1bnNpZ25hYmxlSGVhZGVycyxcbiAgICAgIHNpZ25hYmxlSGVhZGVyc1xuICAgICk7XG4gICAgcmVxdWVzdC5xdWVyeVtTSUdORURfSEVBREVSU19RVUVSWV9QQVJBTV0gPSBnZXRDYW5vbmljYWxIZWFkZXJMaXN0KFxuICAgICAgY2Fub25pY2FsSGVhZGVyc1xuICAgICk7XG5cbiAgICByZXF1ZXN0LnF1ZXJ5W1NJR05BVFVSRV9RVUVSWV9QQVJBTV0gPSBhd2FpdCB0aGlzLmdldFNpZ25hdHVyZShcbiAgICAgIGxvbmdEYXRlLFxuICAgICAgc2NvcGUsXG4gICAgICB0aGlzLmdldFNpZ25pbmdLZXkoY3JlZGVudGlhbHMsIHJlZ2lvbiwgc2hvcnREYXRlKSxcbiAgICAgIHRoaXMuY3JlYXRlQ2Fub25pY2FsUmVxdWVzdChcbiAgICAgICAgcmVxdWVzdCxcbiAgICAgICAgY2Fub25pY2FsSGVhZGVycyxcbiAgICAgICAgYXdhaXQgZ2V0UGF5bG9hZEhhc2gob3JpZ2luYWxSZXF1ZXN0LCB0aGlzLnNoYTI1NilcbiAgICAgIClcbiAgICApO1xuXG4gICAgcmV0dXJuIHJlcXVlc3Q7XG4gIH1cblxuICBwdWJsaWMgc2lnbihcbiAgICBzdHJpbmdUb1NpZ246IHN0cmluZyxcbiAgICBvcHRpb25zPzogU2lnbmluZ0FyZ3VtZW50c1xuICApOiBQcm9taXNlPHN0cmluZz47XG4gIHB1YmxpYyBzaWduPFN0cmVhbVR5cGU+KFxuICAgIHJlcXVlc3RUb1NpZ246IEh0dHBSZXF1ZXN0PFN0cmVhbVR5cGU+LFxuICAgIG9wdGlvbnM/OiBSZXF1ZXN0U2lnbmluZ0FyZ3VtZW50c1xuICApOiBQcm9taXNlPEh0dHBSZXF1ZXN0PFN0cmVhbVR5cGU+PjtcbiAgcHVibGljIGFzeW5jIHNpZ248VCBleHRlbmRzIHN0cmluZyB8IEh0dHBSZXF1ZXN0PGFueT4+KFxuICAgIHRvU2lnbjogVCxcbiAgICB7XG4gICAgICBzaWduaW5nRGF0ZSA9IG5ldyBEYXRlKCksXG4gICAgICAuLi5vcHRpb25zXG4gICAgfTogUmVxdWVzdFNpZ25pbmdBcmd1bWVudHMgfCBTaWduaW5nQXJndW1lbnRzID0ge31cbiAgKTogUHJvbWlzZTxUPiB7XG4gICAgY29uc3QgW3JlZ2lvbiwgY3JlZGVudGlhbHNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgdGhpcy5yZWdpb25Qcm92aWRlcigpLFxuICAgICAgdGhpcy5jcmVkZW50aWFsUHJvdmlkZXIoKVxuICAgIF0pO1xuXG4gICAgaWYgKHR5cGVvZiB0b1NpZ24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiB0aGlzLnNpZ25TdHJpbmcoXG4gICAgICAgIHRvU2lnbixcbiAgICAgICAgc2lnbmluZ0RhdGUsXG4gICAgICAgIHJlZ2lvbixcbiAgICAgICAgY3JlZGVudGlhbHNcbiAgICAgICkgYXMgUHJvbWlzZTxUPjtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qge1xuICAgICAgICB1bnNpZ25hYmxlSGVhZGVycyxcbiAgICAgICAgc2lnbmFibGVIZWFkZXJzXG4gICAgICB9ID0gb3B0aW9ucyBhcyBSZXF1ZXN0U2lnbmluZ0FyZ3VtZW50cztcblxuICAgICAgcmV0dXJuIHRoaXMuc2lnblJlcXVlc3QoXG4gICAgICAgIHRvU2lnbiBhcyBIdHRwUmVxdWVzdDxhbnk+LFxuICAgICAgICBzaWduaW5nRGF0ZSxcbiAgICAgICAgcmVnaW9uLFxuICAgICAgICBjcmVkZW50aWFscyxcbiAgICAgICAgdW5zaWduYWJsZUhlYWRlcnMsXG4gICAgICAgIHNpZ25hYmxlSGVhZGVyc1xuICAgICAgKSBhcyBQcm9taXNlPFQ+O1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgc2lnblN0cmluZyhcbiAgICBzdHJpbmdUb1NpZ246IHN0cmluZyxcbiAgICBzaWduaW5nRGF0ZTogRGF0ZUlucHV0LFxuICAgIHJlZ2lvbjogc3RyaW5nLFxuICAgIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFsc1xuICApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHsgc2hvcnREYXRlIH0gPSBmb3JtYXREYXRlKHNpZ25pbmdEYXRlKTtcblxuICAgIGNvbnN0IGhhc2ggPSBuZXcgdGhpcy5zaGEyNTYoXG4gICAgICBhd2FpdCB0aGlzLmdldFNpZ25pbmdLZXkoY3JlZGVudGlhbHMsIHJlZ2lvbiwgc2hvcnREYXRlKVxuICAgICk7XG4gICAgaGFzaC51cGRhdGUoc3RyaW5nVG9TaWduKTtcbiAgICByZXR1cm4gdG9IZXgoYXdhaXQgaGFzaC5kaWdlc3QoKSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHNpZ25SZXF1ZXN0KFxuICAgIG9yaWdpbmFsUmVxdWVzdDogSHR0cFJlcXVlc3Q8YW55PixcbiAgICBzaWduaW5nRGF0ZTogRGF0ZUlucHV0LFxuICAgIHJlZ2lvbjogc3RyaW5nLFxuICAgIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyxcbiAgICB1bnNpZ25hYmxlSGVhZGVycz86IFNldDxzdHJpbmc+LFxuICAgIHNpZ25hYmxlSGVhZGVycz86IFNldDxzdHJpbmc+XG4gICk6IFByb21pc2U8SHR0cFJlcXVlc3Q8YW55Pj4ge1xuICAgIGNvbnN0IHJlcXVlc3QgPSBwcmVwYXJlUmVxdWVzdChvcmlnaW5hbFJlcXVlc3QpO1xuICAgIGNvbnN0IHsgbG9uZ0RhdGUsIHNob3J0RGF0ZSB9ID0gZm9ybWF0RGF0ZShzaWduaW5nRGF0ZSk7XG4gICAgY29uc3Qgc2NvcGUgPSBjcmVhdGVTY29wZShzaG9ydERhdGUsIHJlZ2lvbiwgdGhpcy5zZXJ2aWNlKTtcblxuICAgIHJlcXVlc3QuaGVhZGVyc1tBTVpfREFURV9IRUFERVJdID0gbG9uZ0RhdGU7XG4gICAgaWYgKGNyZWRlbnRpYWxzLnNlc3Npb25Ub2tlbikge1xuICAgICAgcmVxdWVzdC5oZWFkZXJzW1RPS0VOX0hFQURFUl0gPSBjcmVkZW50aWFscy5zZXNzaW9uVG9rZW47XG4gICAgfVxuXG4gICAgY29uc3QgcGF5bG9hZEhhc2ggPSBhd2FpdCBnZXRQYXlsb2FkSGFzaChyZXF1ZXN0LCB0aGlzLnNoYTI1Nik7XG4gICAgaWYgKCFoYXNIZWFkZXIoU0hBMjU2X0hFQURFUiwgcmVxdWVzdC5oZWFkZXJzKSAmJiB0aGlzLmFwcGx5Q2hlY2tzdW0pIHtcbiAgICAgIHJlcXVlc3QuaGVhZGVyc1tTSEEyNTZfSEVBREVSXSA9IHBheWxvYWRIYXNoO1xuICAgIH1cblxuICAgIGNvbnN0IGNhbm9uaWNhbEhlYWRlcnMgPSBnZXRDYW5vbmljYWxIZWFkZXJzKFxuICAgICAgcmVxdWVzdCxcbiAgICAgIHVuc2lnbmFibGVIZWFkZXJzLFxuICAgICAgc2lnbmFibGVIZWFkZXJzXG4gICAgKTtcbiAgICBjb25zdCBzaWduYXR1cmUgPSBhd2FpdCB0aGlzLmdldFNpZ25hdHVyZShcbiAgICAgIGxvbmdEYXRlLFxuICAgICAgc2NvcGUsXG4gICAgICB0aGlzLmdldFNpZ25pbmdLZXkoY3JlZGVudGlhbHMsIHJlZ2lvbiwgc2hvcnREYXRlKSxcbiAgICAgIHRoaXMuY3JlYXRlQ2Fub25pY2FsUmVxdWVzdChyZXF1ZXN0LCBjYW5vbmljYWxIZWFkZXJzLCBwYXlsb2FkSGFzaClcbiAgICApO1xuXG4gICAgcmVxdWVzdC5oZWFkZXJzW0FVVEhfSEVBREVSXSA9XG4gICAgICBgJHtBTEdPUklUSE1fSURFTlRJRklFUn0gYCArXG4gICAgICBgQ3JlZGVudGlhbD0ke2NyZWRlbnRpYWxzLmFjY2Vzc0tleUlkfS8ke3Njb3BlfSwgYCArXG4gICAgICBgU2lnbmVkSGVhZGVycz0ke2dldENhbm9uaWNhbEhlYWRlckxpc3QoY2Fub25pY2FsSGVhZGVycyl9LCBgICtcbiAgICAgIGBTaWduYXR1cmU9JHtzaWduYXR1cmV9YDtcblxuICAgIHJldHVybiByZXF1ZXN0O1xuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVDYW5vbmljYWxSZXF1ZXN0KFxuICAgIHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PGFueT4sXG4gICAgY2Fub25pY2FsSGVhZGVyczogSGVhZGVyQmFnLFxuICAgIHBheWxvYWRIYXNoOiBzdHJpbmdcbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCBzb3J0ZWRIZWFkZXJzID0gT2JqZWN0LmtleXMoY2Fub25pY2FsSGVhZGVycykuc29ydCgpO1xuICAgIHJldHVybiBgJHtyZXF1ZXN0Lm1ldGhvZH1cbiR7dGhpcy5nZXRDYW5vbmljYWxQYXRoKHJlcXVlc3QpfVxuJHtnZXRDYW5vbmljYWxRdWVyeShyZXF1ZXN0KX1cbiR7c29ydGVkSGVhZGVycy5tYXAobmFtZSA9PiBgJHtuYW1lfToke2Nhbm9uaWNhbEhlYWRlcnNbbmFtZV19YCkuam9pbihcIlxcblwiKX1cblxuJHtzb3J0ZWRIZWFkZXJzLmpvaW4oXCI7XCIpfVxuJHtwYXlsb2FkSGFzaH1gO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVTdHJpbmdUb1NpZ24oXG4gICAgbG9uZ0RhdGU6IHN0cmluZyxcbiAgICBjcmVkZW50aWFsU2NvcGU6IHN0cmluZyxcbiAgICBjYW5vbmljYWxSZXF1ZXN0OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBoYXNoID0gbmV3IHRoaXMuc2hhMjU2KCk7XG4gICAgaGFzaC51cGRhdGUoY2Fub25pY2FsUmVxdWVzdCk7XG4gICAgY29uc3QgaGFzaGVkUmVxdWVzdCA9IGF3YWl0IGhhc2guZGlnZXN0KCk7XG5cbiAgICByZXR1cm4gYCR7QUxHT1JJVEhNX0lERU5USUZJRVJ9XG4ke2xvbmdEYXRlfVxuJHtjcmVkZW50aWFsU2NvcGV9XG4ke3RvSGV4KGhhc2hlZFJlcXVlc3QpfWA7XG4gIH1cblxuICBwcml2YXRlIGdldENhbm9uaWNhbFBhdGgoeyBwYXRoIH06IEh0dHBSZXF1ZXN0PGFueT4pOiBzdHJpbmcge1xuICAgIGlmICh0aGlzLnVyaUVzY2FwZVBhdGgpIHtcbiAgICAgIGNvbnN0IGRvdWJsZUVuY29kZWQgPSBlbmNvZGVVUklDb21wb25lbnQocGF0aC5yZXBsYWNlKC9eXFwvLywgXCJcIikpO1xuICAgICAgcmV0dXJuIGAvJHtkb3VibGVFbmNvZGVkLnJlcGxhY2UoLyUyRi9nLCBcIi9cIil9YDtcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2V0U2lnbmF0dXJlKFxuICAgIGxvbmdEYXRlOiBzdHJpbmcsXG4gICAgY3JlZGVudGlhbFNjb3BlOiBzdHJpbmcsXG4gICAga2V5UHJvbWlzZTogUHJvbWlzZTxVaW50OEFycmF5PixcbiAgICBjYW5vbmljYWxSZXF1ZXN0OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzdHJpbmdUb1NpZ24gPSBhd2FpdCB0aGlzLmNyZWF0ZVN0cmluZ1RvU2lnbihcbiAgICAgIGxvbmdEYXRlLFxuICAgICAgY3JlZGVudGlhbFNjb3BlLFxuICAgICAgY2Fub25pY2FsUmVxdWVzdFxuICAgICk7XG5cbiAgICBjb25zdCBoYXNoID0gbmV3IHRoaXMuc2hhMjU2KGF3YWl0IGtleVByb21pc2UpO1xuICAgIGhhc2gudXBkYXRlKHN0cmluZ1RvU2lnbik7XG4gICAgcmV0dXJuIHRvSGV4KGF3YWl0IGhhc2guZGlnZXN0KCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTaWduaW5nS2V5KFxuICAgIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyxcbiAgICByZWdpb246IHN0cmluZyxcbiAgICBzaG9ydERhdGU6IHN0cmluZ1xuICApOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgICByZXR1cm4gZ2V0U2lnbmluZ0tleShcbiAgICAgIHRoaXMuc2hhMjU2LFxuICAgICAgY3JlZGVudGlhbHMsXG4gICAgICBzaG9ydERhdGUsXG4gICAgICByZWdpb24sXG4gICAgICB0aGlzLnNlcnZpY2VcbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZvcm1hdERhdGUobm93OiBEYXRlSW5wdXQpOiB7IGxvbmdEYXRlOiBzdHJpbmc7IHNob3J0RGF0ZTogc3RyaW5nIH0ge1xuICBjb25zdCBsb25nRGF0ZSA9IGlzbzg2MDEobm93KS5yZXBsYWNlKC9bXFwtOl0vZywgXCJcIik7XG4gIHJldHVybiB7XG4gICAgbG9uZ0RhdGUsXG4gICAgc2hvcnREYXRlOiBsb25nRGF0ZS5zdWJzdHIoMCwgOClcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2Fub25pY2FsSGVhZGVyTGlzdChoZWFkZXJzOiBvYmplY3QpOiBzdHJpbmcge1xuICByZXR1cm4gT2JqZWN0LmtleXMoaGVhZGVycylcbiAgICAuc29ydCgpXG4gICAgLmpvaW4oXCI7XCIpO1xufVxuXG5mdW5jdGlvbiBnZXRUdGwoc3RhcnQ6IERhdGVJbnB1dCwgZXhwaXJhdGlvbjogRGF0ZUlucHV0KTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGguZmxvb3IoXG4gICAgKHRvRGF0ZShleHBpcmF0aW9uKS52YWx1ZU9mKCkgLSB0b0RhdGUoc3RhcnQpLnZhbHVlT2YoKSkgLyAxMDAwXG4gICk7XG59XG4iXX0=

/***/ }),

/***/ 45155:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(75636);
/**
 * @internal
 */
function cloneRequest(_a) {
    var { headers, query } = _a, rest = tslib_1.__rest(_a, ["headers", "query"]);
    return Object.assign({}, rest, { headers: Object.assign({}, headers), query: query ? cloneQuery(query) : undefined });
}
exports.cloneRequest = cloneRequest;
function cloneQuery(query) {
    return Object.keys(query).reduce((carry, paramName) => {
        const param = query[paramName];
        return Object.assign({}, carry, { [paramName]: Array.isArray(param) ? [...param] : param });
    }, {});
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvbmVSZXF1ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2Nsb25lUmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQTs7R0FFRztBQUNILFNBQWdCLFlBQVksQ0FBYSxFQUlmO1FBSmUsRUFDdkMsT0FBTyxFQUNQLEtBQUssT0FFbUIsRUFEeEIsK0NBQU87SUFFUCx5QkFDSyxJQUFJLElBQ1AsT0FBTyxvQkFBTyxPQUFPLEdBQ3JCLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUM1QztBQUNKLENBQUM7QUFWRCxvQ0FVQztBQUVELFNBQVMsVUFBVSxDQUFDLEtBQXdCO0lBQzFDLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQzlCLENBQUMsS0FBd0IsRUFBRSxTQUFpQixFQUFFLEVBQUU7UUFDOUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9CLHlCQUNLLEtBQUssSUFDUixDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUN0RDtJQUNKLENBQUMsRUFDRCxFQUFFLENBQ0gsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBIdHRwUmVxdWVzdCwgUXVlcnlQYXJhbWV0ZXJCYWcgfSBmcm9tIFwiQGF3cy1zZGsvdHlwZXNcIjtcblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNsb25lUmVxdWVzdDxTdHJlYW1UeXBlPih7XG4gIGhlYWRlcnMsXG4gIHF1ZXJ5LFxuICAuLi5yZXN0XG59OiBIdHRwUmVxdWVzdDxTdHJlYW1UeXBlPik6IEh0dHBSZXF1ZXN0PFN0cmVhbVR5cGU+IHtcbiAgcmV0dXJuIHtcbiAgICAuLi5yZXN0LFxuICAgIGhlYWRlcnM6IHsgLi4uaGVhZGVycyB9LFxuICAgIHF1ZXJ5OiBxdWVyeSA/IGNsb25lUXVlcnkocXVlcnkpIDogdW5kZWZpbmVkXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNsb25lUXVlcnkocXVlcnk6IFF1ZXJ5UGFyYW1ldGVyQmFnKTogUXVlcnlQYXJhbWV0ZXJCYWcge1xuICByZXR1cm4gT2JqZWN0LmtleXMocXVlcnkpLnJlZHVjZShcbiAgICAoY2Fycnk6IFF1ZXJ5UGFyYW1ldGVyQmFnLCBwYXJhbU5hbWU6IHN0cmluZykgPT4ge1xuICAgICAgY29uc3QgcGFyYW0gPSBxdWVyeVtwYXJhbU5hbWVdO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgLi4uY2FycnksXG4gICAgICAgIFtwYXJhbU5hbWVdOiBBcnJheS5pc0FycmF5KHBhcmFtKSA/IFsuLi5wYXJhbV0gOiBwYXJhbVxuICAgICAgfTtcbiAgICB9LFxuICAgIHt9XG4gICk7XG59XG4iXX0=

/***/ }),

/***/ 13248:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
exports.CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
exports.AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
exports.SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
exports.EXPIRES_QUERY_PARAM = "X-Amz-Expires";
exports.SIGNATURE_QUERY_PARAM = "X-Amz-Signature";
exports.TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
exports.AUTH_HEADER = "authorization";
exports.AMZ_DATE_HEADER = exports.AMZ_DATE_QUERY_PARAM.toLowerCase();
exports.DATE_HEADER = "date";
exports.GENERATED_HEADERS = [exports.AUTH_HEADER, exports.AMZ_DATE_HEADER, exports.DATE_HEADER];
exports.SIGNATURE_HEADER = exports.SIGNATURE_QUERY_PARAM.toLowerCase();
exports.SHA256_HEADER = "x-amz-content-sha256";
exports.TOKEN_HEADER = exports.TOKEN_QUERY_PARAM.toLowerCase();
exports.HOST_HEADER = "host";
exports.ALWAYS_UNSIGNABLE_HEADERS = {
    authorization: true,
    "cache-control": true,
    connection: true,
    expect: true,
    from: true,
    "keep-alive": true,
    "max-forwards": true,
    pragma: true,
    referer: true,
    te: true,
    trailer: true,
    "transfer-encoding": true,
    upgrade: true,
    "user-agent": true,
    "x-amzn-trace-id": true
};
exports.PROXY_HEADER_PATTERN = /^proxy-/;
exports.SEC_HEADER_PATTERN = /^sec-/;
exports.UNSIGNABLE_PATTERNS = [/^proxy-/i, /^sec-/i];
exports.ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
exports.UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
exports.MAX_CACHE_SIZE = 50;
exports.KEY_TYPE_IDENTIFIER = "aws4_request";
exports.MAX_PRESIGNED_TTL = 60 * 60 * 24 * 7;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbnN0YW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFhLFFBQUEscUJBQXFCLEdBQUcsaUJBQWlCLENBQUM7QUFDMUMsUUFBQSxzQkFBc0IsR0FBRyxrQkFBa0IsQ0FBQztBQUM1QyxRQUFBLG9CQUFvQixHQUFHLFlBQVksQ0FBQztBQUNwQyxRQUFBLDBCQUEwQixHQUFHLHFCQUFxQixDQUFDO0FBQ25ELFFBQUEsbUJBQW1CLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLFFBQUEscUJBQXFCLEdBQUcsaUJBQWlCLENBQUM7QUFDMUMsUUFBQSxpQkFBaUIsR0FBRyxzQkFBc0IsQ0FBQztBQUUzQyxRQUFBLFdBQVcsR0FBRyxlQUFlLENBQUM7QUFDOUIsUUFBQSxlQUFlLEdBQUcsNEJBQW9CLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDckQsUUFBQSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBQ3JCLFFBQUEsaUJBQWlCLEdBQUcsQ0FBQyxtQkFBVyxFQUFFLHVCQUFlLEVBQUUsbUJBQVcsQ0FBQyxDQUFDO0FBQ2hFLFFBQUEsZ0JBQWdCLEdBQUcsNkJBQXFCLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkQsUUFBQSxhQUFhLEdBQUcsc0JBQXNCLENBQUM7QUFDdkMsUUFBQSxZQUFZLEdBQUcseUJBQWlCLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDL0MsUUFBQSxXQUFXLEdBQUcsTUFBTSxDQUFDO0FBRXJCLFFBQUEseUJBQXlCLEdBQUc7SUFDdkMsYUFBYSxFQUFFLElBQUk7SUFDbkIsZUFBZSxFQUFFLElBQUk7SUFDckIsVUFBVSxFQUFFLElBQUk7SUFDaEIsTUFBTSxFQUFFLElBQUk7SUFDWixJQUFJLEVBQUUsSUFBSTtJQUNWLFlBQVksRUFBRSxJQUFJO0lBQ2xCLGNBQWMsRUFBRSxJQUFJO0lBQ3BCLE1BQU0sRUFBRSxJQUFJO0lBQ1osT0FBTyxFQUFFLElBQUk7SUFDYixFQUFFLEVBQUUsSUFBSTtJQUNSLE9BQU8sRUFBRSxJQUFJO0lBQ2IsbUJBQW1CLEVBQUUsSUFBSTtJQUN6QixPQUFPLEVBQUUsSUFBSTtJQUNiLFlBQVksRUFBRSxJQUFJO0lBQ2xCLGlCQUFpQixFQUFFLElBQUk7Q0FDeEIsQ0FBQztBQUVXLFFBQUEsb0JBQW9CLEdBQUcsU0FBUyxDQUFDO0FBRWpDLFFBQUEsa0JBQWtCLEdBQUcsT0FBTyxDQUFDO0FBRTdCLFFBQUEsbUJBQW1CLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFFN0MsUUFBQSxvQkFBb0IsR0FBRyxrQkFBa0IsQ0FBQztBQUUxQyxRQUFBLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDO0FBRXRDLFFBQUEsY0FBYyxHQUFHLEVBQUUsQ0FBQztBQUNwQixRQUFBLG1CQUFtQixHQUFHLGNBQWMsQ0FBQztBQUVyQyxRQUFBLGlCQUFpQixHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBBTEdPUklUSE1fUVVFUllfUEFSQU0gPSBcIlgtQW16LUFsZ29yaXRobVwiO1xuZXhwb3J0IGNvbnN0IENSRURFTlRJQUxfUVVFUllfUEFSQU0gPSBcIlgtQW16LUNyZWRlbnRpYWxcIjtcbmV4cG9ydCBjb25zdCBBTVpfREFURV9RVUVSWV9QQVJBTSA9IFwiWC1BbXotRGF0ZVwiO1xuZXhwb3J0IGNvbnN0IFNJR05FRF9IRUFERVJTX1FVRVJZX1BBUkFNID0gXCJYLUFtei1TaWduZWRIZWFkZXJzXCI7XG5leHBvcnQgY29uc3QgRVhQSVJFU19RVUVSWV9QQVJBTSA9IFwiWC1BbXotRXhwaXJlc1wiO1xuZXhwb3J0IGNvbnN0IFNJR05BVFVSRV9RVUVSWV9QQVJBTSA9IFwiWC1BbXotU2lnbmF0dXJlXCI7XG5leHBvcnQgY29uc3QgVE9LRU5fUVVFUllfUEFSQU0gPSBcIlgtQW16LVNlY3VyaXR5LVRva2VuXCI7XG5cbmV4cG9ydCBjb25zdCBBVVRIX0hFQURFUiA9IFwiYXV0aG9yaXphdGlvblwiO1xuZXhwb3J0IGNvbnN0IEFNWl9EQVRFX0hFQURFUiA9IEFNWl9EQVRFX1FVRVJZX1BBUkFNLnRvTG93ZXJDYXNlKCk7XG5leHBvcnQgY29uc3QgREFURV9IRUFERVIgPSBcImRhdGVcIjtcbmV4cG9ydCBjb25zdCBHRU5FUkFURURfSEVBREVSUyA9IFtBVVRIX0hFQURFUiwgQU1aX0RBVEVfSEVBREVSLCBEQVRFX0hFQURFUl07XG5leHBvcnQgY29uc3QgU0lHTkFUVVJFX0hFQURFUiA9IFNJR05BVFVSRV9RVUVSWV9QQVJBTS50b0xvd2VyQ2FzZSgpO1xuZXhwb3J0IGNvbnN0IFNIQTI1Nl9IRUFERVIgPSBcIngtYW16LWNvbnRlbnQtc2hhMjU2XCI7XG5leHBvcnQgY29uc3QgVE9LRU5fSEVBREVSID0gVE9LRU5fUVVFUllfUEFSQU0udG9Mb3dlckNhc2UoKTtcbmV4cG9ydCBjb25zdCBIT1NUX0hFQURFUiA9IFwiaG9zdFwiO1xuXG5leHBvcnQgY29uc3QgQUxXQVlTX1VOU0lHTkFCTEVfSEVBREVSUyA9IHtcbiAgYXV0aG9yaXphdGlvbjogdHJ1ZSxcbiAgXCJjYWNoZS1jb250cm9sXCI6IHRydWUsXG4gIGNvbm5lY3Rpb246IHRydWUsXG4gIGV4cGVjdDogdHJ1ZSxcbiAgZnJvbTogdHJ1ZSxcbiAgXCJrZWVwLWFsaXZlXCI6IHRydWUsXG4gIFwibWF4LWZvcndhcmRzXCI6IHRydWUsXG4gIHByYWdtYTogdHJ1ZSxcbiAgcmVmZXJlcjogdHJ1ZSxcbiAgdGU6IHRydWUsXG4gIHRyYWlsZXI6IHRydWUsXG4gIFwidHJhbnNmZXItZW5jb2RpbmdcIjogdHJ1ZSxcbiAgdXBncmFkZTogdHJ1ZSxcbiAgXCJ1c2VyLWFnZW50XCI6IHRydWUsXG4gIFwieC1hbXpuLXRyYWNlLWlkXCI6IHRydWVcbn07XG5cbmV4cG9ydCBjb25zdCBQUk9YWV9IRUFERVJfUEFUVEVSTiA9IC9ecHJveHktLztcblxuZXhwb3J0IGNvbnN0IFNFQ19IRUFERVJfUEFUVEVSTiA9IC9ec2VjLS87XG5cbmV4cG9ydCBjb25zdCBVTlNJR05BQkxFX1BBVFRFUk5TID0gWy9ecHJveHktL2ksIC9ec2VjLS9pXTtcblxuZXhwb3J0IGNvbnN0IEFMR09SSVRITV9JREVOVElGSUVSID0gXCJBV1M0LUhNQUMtU0hBMjU2XCI7XG5cbmV4cG9ydCBjb25zdCBVTlNJR05FRF9QQVlMT0FEID0gXCJVTlNJR05FRC1QQVlMT0FEXCI7XG5cbmV4cG9ydCBjb25zdCBNQVhfQ0FDSEVfU0laRSA9IDUwO1xuZXhwb3J0IGNvbnN0IEtFWV9UWVBFX0lERU5USUZJRVIgPSBcImF3czRfcmVxdWVzdFwiO1xuXG5leHBvcnQgY29uc3QgTUFYX1BSRVNJR05FRF9UVEwgPSA2MCAqIDYwICogMjQgKiA3O1xuIl19

/***/ }),

/***/ 27639:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const constants_1 = __webpack_require__(13248);
const signingKeyCache = {};
const cacheQueue = [];
/**
 * Create a string describing the scope of credentials used to sign a request.
 *
 * @param shortDate The current calendar date in the form YYYYMMDD.
 * @param region    The AWS region in which the service resides.
 * @param service   The service to which the signed request is being sent.
 */
function createScope(shortDate, region, service) {
    return `${shortDate}/${region}/${service}/${constants_1.KEY_TYPE_IDENTIFIER}`;
}
exports.createScope = createScope;
/**
 * Derive a signing key from its composite parts
 *
 * @param sha256Constructor A constructor function that can instantiate SHA-256
 *                          hash objects.
 * @param credentials       The credentials with which the request will be
 *                          signed.
 * @param shortDate         The current calendar date in the form YYYYMMDD.
 * @param region            The AWS region in which the service resides.
 * @param service           The service to which the signed request is being
 *                          sent.
 */
function getSigningKey(sha256Constructor, credentials, shortDate, region, service) {
    const cacheKey = `${shortDate}:${region}:${service}:` +
        `${credentials.accessKeyId}:${credentials.sessionToken}`;
    if (cacheKey in signingKeyCache) {
        return signingKeyCache[cacheKey];
    }
    cacheQueue.push(cacheKey);
    while (cacheQueue.length > constants_1.MAX_CACHE_SIZE) {
        delete signingKeyCache[cacheQueue.shift()];
    }
    return (signingKeyCache[cacheKey] = new Promise((resolve, reject) => {
        let keyPromise = Promise.resolve(`AWS4${credentials.secretAccessKey}`);
        for (let signable of [shortDate, region, service, constants_1.KEY_TYPE_IDENTIFIER]) {
            keyPromise = keyPromise.then(intermediateKey => hmac(sha256Constructor, intermediateKey, signable));
            keyPromise.catch(() => { });
        }
        keyPromise.then(resolve, reason => {
            delete signingKeyCache[cacheKey];
            reject(reason);
        });
    }));
}
exports.getSigningKey = getSigningKey;
/**
 * @internal
 */
function clearCredentialCache() {
    cacheQueue.length = 0;
    Object.keys(signingKeyCache).forEach(cacheKey => {
        delete signingKeyCache[cacheKey];
    });
}
exports.clearCredentialCache = clearCredentialCache;
function hmac(ctor, secret, data) {
    const hash = new ctor(secret);
    hash.update(data);
    return hash.digest();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlZGVudGlhbERlcml2YXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvY3JlZGVudGlhbERlcml2YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwyQ0FBa0U7QUFFbEUsTUFBTSxlQUFlLEdBQTJDLEVBQUUsQ0FBQztBQUNuRSxNQUFNLFVBQVUsR0FBa0IsRUFBRSxDQUFDO0FBRXJDOzs7Ozs7R0FNRztBQUNILFNBQWdCLFdBQVcsQ0FDekIsU0FBaUIsRUFDakIsTUFBYyxFQUNkLE9BQWU7SUFFZixPQUFPLEdBQUcsU0FBUyxJQUFJLE1BQU0sSUFBSSxPQUFPLElBQUksK0JBQW1CLEVBQUUsQ0FBQztBQUNwRSxDQUFDO0FBTkQsa0NBTUM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILFNBQWdCLGFBQWEsQ0FDM0IsaUJBQWtDLEVBQ2xDLFdBQXdCLEVBQ3hCLFNBQWlCLEVBQ2pCLE1BQWMsRUFDZCxPQUFlO0lBRWYsTUFBTSxRQUFRLEdBQ1osR0FBRyxTQUFTLElBQUksTUFBTSxJQUFJLE9BQU8sR0FBRztRQUNwQyxHQUFHLFdBQVcsQ0FBQyxXQUFXLElBQUksV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQzNELElBQUksUUFBUSxJQUFJLGVBQWUsRUFBRTtRQUMvQixPQUFPLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNsQztJQUVELFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDMUIsT0FBTyxVQUFVLENBQUMsTUFBTSxHQUFHLDBCQUFjLEVBQUU7UUFDekMsT0FBTyxlQUFlLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBWSxDQUFDLENBQUM7S0FDdEQ7SUFFRCxPQUFPLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ2xFLElBQUksVUFBVSxHQUF3QixPQUFPLENBQUMsT0FBTyxDQUNuRCxPQUFPLFdBQVcsQ0FBQyxlQUFlLEVBQUUsQ0FDckMsQ0FBQztRQUVGLEtBQUssSUFBSSxRQUFRLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSwrQkFBbUIsQ0FBQyxFQUFFO1lBQ3RFLFVBQVUsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFhLGVBQWUsQ0FBQyxFQUFFLENBQ3pELElBQUksQ0FBQyxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQ25ELENBQUM7WUFDRixVQUFVLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxHQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzVCO1FBRUEsVUFBa0MsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxFQUFFO1lBQ3pELE9BQU8sZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDTixDQUFDO0FBcENELHNDQW9DQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0Isb0JBQW9CO0lBQ2xDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ3RCLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzlDLE9BQU8sZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ25DLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUxELG9EQUtDO0FBRUQsU0FBUyxJQUFJLENBQ1gsSUFBcUIsRUFDckIsTUFBa0IsRUFDbEIsSUFBZ0I7SUFFaEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNsQixPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUN2QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3JlZGVudGlhbHMsIEhhc2hDb25zdHJ1Y3RvciwgU291cmNlRGF0YSB9IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuaW1wb3J0IHsgS0VZX1RZUEVfSURFTlRJRklFUiwgTUFYX0NBQ0hFX1NJWkUgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcblxuY29uc3Qgc2lnbmluZ0tleUNhY2hlOiB7IFtrZXk6IHN0cmluZ106IFByb21pc2U8VWludDhBcnJheT4gfSA9IHt9O1xuY29uc3QgY2FjaGVRdWV1ZTogQXJyYXk8c3RyaW5nPiA9IFtdO1xuXG4vKipcbiAqIENyZWF0ZSBhIHN0cmluZyBkZXNjcmliaW5nIHRoZSBzY29wZSBvZiBjcmVkZW50aWFscyB1c2VkIHRvIHNpZ24gYSByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSBzaG9ydERhdGUgVGhlIGN1cnJlbnQgY2FsZW5kYXIgZGF0ZSBpbiB0aGUgZm9ybSBZWVlZTU1ERC5cbiAqIEBwYXJhbSByZWdpb24gICAgVGhlIEFXUyByZWdpb24gaW4gd2hpY2ggdGhlIHNlcnZpY2UgcmVzaWRlcy5cbiAqIEBwYXJhbSBzZXJ2aWNlICAgVGhlIHNlcnZpY2UgdG8gd2hpY2ggdGhlIHNpZ25lZCByZXF1ZXN0IGlzIGJlaW5nIHNlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTY29wZShcbiAgc2hvcnREYXRlOiBzdHJpbmcsXG4gIHJlZ2lvbjogc3RyaW5nLFxuICBzZXJ2aWNlOiBzdHJpbmdcbik6IHN0cmluZyB7XG4gIHJldHVybiBgJHtzaG9ydERhdGV9LyR7cmVnaW9ufS8ke3NlcnZpY2V9LyR7S0VZX1RZUEVfSURFTlRJRklFUn1gO1xufVxuXG4vKipcbiAqIERlcml2ZSBhIHNpZ25pbmcga2V5IGZyb20gaXRzIGNvbXBvc2l0ZSBwYXJ0c1xuICpcbiAqIEBwYXJhbSBzaGEyNTZDb25zdHJ1Y3RvciBBIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIHRoYXQgY2FuIGluc3RhbnRpYXRlIFNIQS0yNTZcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICBoYXNoIG9iamVjdHMuXG4gKiBAcGFyYW0gY3JlZGVudGlhbHMgICAgICAgVGhlIGNyZWRlbnRpYWxzIHdpdGggd2hpY2ggdGhlIHJlcXVlc3Qgd2lsbCBiZVxuICogICAgICAgICAgICAgICAgICAgICAgICAgIHNpZ25lZC5cbiAqIEBwYXJhbSBzaG9ydERhdGUgICAgICAgICBUaGUgY3VycmVudCBjYWxlbmRhciBkYXRlIGluIHRoZSBmb3JtIFlZWVlNTURELlxuICogQHBhcmFtIHJlZ2lvbiAgICAgICAgICAgIFRoZSBBV1MgcmVnaW9uIGluIHdoaWNoIHRoZSBzZXJ2aWNlIHJlc2lkZXMuXG4gKiBAcGFyYW0gc2VydmljZSAgICAgICAgICAgVGhlIHNlcnZpY2UgdG8gd2hpY2ggdGhlIHNpZ25lZCByZXF1ZXN0IGlzIGJlaW5nXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgc2VudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFNpZ25pbmdLZXkoXG4gIHNoYTI1NkNvbnN0cnVjdG9yOiBIYXNoQ29uc3RydWN0b3IsXG4gIGNyZWRlbnRpYWxzOiBDcmVkZW50aWFscyxcbiAgc2hvcnREYXRlOiBzdHJpbmcsXG4gIHJlZ2lvbjogc3RyaW5nLFxuICBzZXJ2aWNlOiBzdHJpbmdcbik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBjb25zdCBjYWNoZUtleSA9XG4gICAgYCR7c2hvcnREYXRlfToke3JlZ2lvbn06JHtzZXJ2aWNlfTpgICtcbiAgICBgJHtjcmVkZW50aWFscy5hY2Nlc3NLZXlJZH06JHtjcmVkZW50aWFscy5zZXNzaW9uVG9rZW59YDtcbiAgaWYgKGNhY2hlS2V5IGluIHNpZ25pbmdLZXlDYWNoZSkge1xuICAgIHJldHVybiBzaWduaW5nS2V5Q2FjaGVbY2FjaGVLZXldO1xuICB9XG5cbiAgY2FjaGVRdWV1ZS5wdXNoKGNhY2hlS2V5KTtcbiAgd2hpbGUgKGNhY2hlUXVldWUubGVuZ3RoID4gTUFYX0NBQ0hFX1NJWkUpIHtcbiAgICBkZWxldGUgc2lnbmluZ0tleUNhY2hlW2NhY2hlUXVldWUuc2hpZnQoKSBhcyBzdHJpbmddO1xuICB9XG5cbiAgcmV0dXJuIChzaWduaW5nS2V5Q2FjaGVbY2FjaGVLZXldID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBrZXlQcm9taXNlOiBQcm9taXNlPFNvdXJjZURhdGE+ID0gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgYEFXUzQke2NyZWRlbnRpYWxzLnNlY3JldEFjY2Vzc0tleX1gXG4gICAgKTtcblxuICAgIGZvciAobGV0IHNpZ25hYmxlIG9mIFtzaG9ydERhdGUsIHJlZ2lvbiwgc2VydmljZSwgS0VZX1RZUEVfSURFTlRJRklFUl0pIHtcbiAgICAgIGtleVByb21pc2UgPSBrZXlQcm9taXNlLnRoZW48VWludDhBcnJheT4oaW50ZXJtZWRpYXRlS2V5ID0+XG4gICAgICAgIGhtYWMoc2hhMjU2Q29uc3RydWN0b3IsIGludGVybWVkaWF0ZUtleSwgc2lnbmFibGUpXG4gICAgICApO1xuICAgICAga2V5UHJvbWlzZS5jYXRjaCgoKSA9PiB7fSk7XG4gICAgfVxuXG4gICAgKGtleVByb21pc2UgYXMgUHJvbWlzZTxVaW50OEFycmF5PikudGhlbihyZXNvbHZlLCByZWFzb24gPT4ge1xuICAgICAgZGVsZXRlIHNpZ25pbmdLZXlDYWNoZVtjYWNoZUtleV07XG4gICAgICByZWplY3QocmVhc29uKTtcbiAgICB9KTtcbiAgfSkpO1xufVxuXG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2xlYXJDcmVkZW50aWFsQ2FjaGUoKTogdm9pZCB7XG4gIGNhY2hlUXVldWUubGVuZ3RoID0gMDtcbiAgT2JqZWN0LmtleXMoc2lnbmluZ0tleUNhY2hlKS5mb3JFYWNoKGNhY2hlS2V5ID0+IHtcbiAgICBkZWxldGUgc2lnbmluZ0tleUNhY2hlW2NhY2hlS2V5XTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGhtYWMoXG4gIGN0b3I6IEhhc2hDb25zdHJ1Y3RvcixcbiAgc2VjcmV0OiBTb3VyY2VEYXRhLFxuICBkYXRhOiBTb3VyY2VEYXRhXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3QgaGFzaCA9IG5ldyBjdG9yKHNlY3JldCk7XG4gIGhhc2gudXBkYXRlKGRhdGEpO1xuICByZXR1cm4gaGFzaC5kaWdlc3QoKTtcbn1cbiJdfQ==

/***/ }),

/***/ 24628:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const constants_1 = __webpack_require__(13248);
/**
 * @internal
 */
function getCanonicalHeaders({ headers }, unsignableHeaders, signableHeaders) {
    const canonical = {};
    for (let headerName of Object.keys(headers).sort()) {
        const canonicalHeaderName = headerName.toLowerCase();
        if (canonicalHeaderName in constants_1.ALWAYS_UNSIGNABLE_HEADERS ||
            (unsignableHeaders && unsignableHeaders.has(canonicalHeaderName)) ||
            constants_1.PROXY_HEADER_PATTERN.test(canonicalHeaderName) ||
            constants_1.SEC_HEADER_PATTERN.test(canonicalHeaderName)) {
            if (!signableHeaders ||
                (signableHeaders && !signableHeaders.has(canonicalHeaderName))) {
                continue;
            }
        }
        canonical[canonicalHeaderName] = headers[headerName]
            .trim()
            .replace(/\s+/g, " ");
    }
    return canonical;
}
exports.getCanonicalHeaders = getCanonicalHeaders;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0Q2Fub25pY2FsSGVhZGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9nZXRDYW5vbmljYWxIZWFkZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQ0EsMkNBSXFCO0FBRXJCOztHQUVHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQ2pDLEVBQUUsT0FBTyxFQUFvQixFQUM3QixpQkFBK0IsRUFDL0IsZUFBNkI7SUFFN0IsTUFBTSxTQUFTLEdBQWMsRUFBRSxDQUFDO0lBQ2hDLEtBQUssSUFBSSxVQUFVLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNsRCxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNyRCxJQUNFLG1CQUFtQixJQUFJLHFDQUF5QjtZQUNoRCxDQUFDLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pFLGdDQUFvQixDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztZQUM5Qyw4QkFBa0IsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFDNUM7WUFDQSxJQUNFLENBQUMsZUFBZTtnQkFDaEIsQ0FBQyxlQUFlLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUMsRUFDOUQ7Z0JBQ0EsU0FBUzthQUNWO1NBQ0Y7UUFFRCxTQUFTLENBQUMsbUJBQW1CLENBQUMsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO2FBQ2pELElBQUksRUFBRTthQUNOLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDekI7SUFFRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBNUJELGtEQTRCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEh0dHBSZXF1ZXN0LCBIZWFkZXJCYWcgfSBmcm9tIFwiQGF3cy1zZGsvdHlwZXNcIjtcbmltcG9ydCB7XG4gIEFMV0FZU19VTlNJR05BQkxFX0hFQURFUlMsXG4gIFBST1hZX0hFQURFUl9QQVRURVJOLFxuICBTRUNfSEVBREVSX1BBVFRFUk5cbn0gZnJvbSBcIi4vY29uc3RhbnRzXCI7XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDYW5vbmljYWxIZWFkZXJzKFxuICB7IGhlYWRlcnMgfTogSHR0cFJlcXVlc3Q8YW55PixcbiAgdW5zaWduYWJsZUhlYWRlcnM/OiBTZXQ8c3RyaW5nPixcbiAgc2lnbmFibGVIZWFkZXJzPzogU2V0PHN0cmluZz5cbik6IEhlYWRlckJhZyB7XG4gIGNvbnN0IGNhbm9uaWNhbDogSGVhZGVyQmFnID0ge307XG4gIGZvciAobGV0IGhlYWRlck5hbWUgb2YgT2JqZWN0LmtleXMoaGVhZGVycykuc29ydCgpKSB7XG4gICAgY29uc3QgY2Fub25pY2FsSGVhZGVyTmFtZSA9IGhlYWRlck5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAoXG4gICAgICBjYW5vbmljYWxIZWFkZXJOYW1lIGluIEFMV0FZU19VTlNJR05BQkxFX0hFQURFUlMgfHxcbiAgICAgICh1bnNpZ25hYmxlSGVhZGVycyAmJiB1bnNpZ25hYmxlSGVhZGVycy5oYXMoY2Fub25pY2FsSGVhZGVyTmFtZSkpIHx8XG4gICAgICBQUk9YWV9IRUFERVJfUEFUVEVSTi50ZXN0KGNhbm9uaWNhbEhlYWRlck5hbWUpIHx8XG4gICAgICBTRUNfSEVBREVSX1BBVFRFUk4udGVzdChjYW5vbmljYWxIZWFkZXJOYW1lKVxuICAgICkge1xuICAgICAgaWYgKFxuICAgICAgICAhc2lnbmFibGVIZWFkZXJzIHx8XG4gICAgICAgIChzaWduYWJsZUhlYWRlcnMgJiYgIXNpZ25hYmxlSGVhZGVycy5oYXMoY2Fub25pY2FsSGVhZGVyTmFtZSkpXG4gICAgICApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY2Fub25pY2FsW2Nhbm9uaWNhbEhlYWRlck5hbWVdID0gaGVhZGVyc1toZWFkZXJOYW1lXVxuICAgICAgLnRyaW0oKVxuICAgICAgLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICB9XG5cbiAgcmV0dXJuIGNhbm9uaWNhbDtcbn1cbiJdfQ==

/***/ }),

/***/ 36013:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const constants_1 = __webpack_require__(13248);
/**
 * @internal
 */
function getCanonicalQuery({ query = {} }) {
    const keys = [];
    const serialized = {};
    for (let key of Object.keys(query).sort()) {
        if (key.toLowerCase() === constants_1.SIGNATURE_HEADER) {
            continue;
        }
        keys.push(key);
        const value = query[key];
        if (typeof value === "string") {
            serialized[key] = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        }
        else if (Array.isArray(value)) {
            serialized[key] = value
                .slice(0)
                .sort()
                .reduce((encoded, value) => encoded.concat([
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            ]), [])
                .join("&");
        }
    }
    return keys
        .map(key => serialized[key])
        .filter(serialized => serialized) // omit any falsy values
        .join("&");
}
exports.getCanonicalQuery = getCanonicalQuery;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0Q2Fub25pY2FsUXVlcnkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZ2V0Q2Fub25pY2FsUXVlcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBK0M7QUFHL0M7O0dBRUc7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxFQUFFLEtBQUssR0FBRyxFQUFFLEVBQW9CO0lBQ2hFLE1BQU0sSUFBSSxHQUFrQixFQUFFLENBQUM7SUFDL0IsTUFBTSxVQUFVLEdBQThCLEVBQUUsQ0FBQztJQUNqRCxLQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7UUFDekMsSUFBSSxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssNEJBQWdCLEVBQUU7WUFDMUMsU0FBUztTQUNWO1FBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN6QixJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtZQUM3QixVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBa0IsQ0FDaEUsS0FBSyxDQUNOLEVBQUUsQ0FBQztTQUNMO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQy9CLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLO2lCQUNwQixLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUNSLElBQUksRUFBRTtpQkFDTixNQUFNLENBQ0wsQ0FBQyxPQUFzQixFQUFFLEtBQWEsRUFBRSxFQUFFLENBQ3hDLE9BQU8sQ0FBQyxNQUFNLENBQUM7Z0JBQ2IsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTthQUMxRCxDQUFDLEVBQ0osRUFBRSxDQUNIO2lCQUNBLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNkO0tBQ0Y7SUFFRCxPQUFPLElBQUk7U0FDUixHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDM0IsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsd0JBQXdCO1NBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmLENBQUM7QUFqQ0QsOENBaUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU0lHTkFUVVJFX0hFQURFUiB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuaW1wb3J0IHsgSHR0cFJlcXVlc3QgfSBmcm9tIFwiQGF3cy1zZGsvdHlwZXNcIjtcblxuLyoqXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldENhbm9uaWNhbFF1ZXJ5KHsgcXVlcnkgPSB7fSB9OiBIdHRwUmVxdWVzdDxhbnk+KTogc3RyaW5nIHtcbiAgY29uc3Qga2V5czogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICBjb25zdCBzZXJpYWxpemVkOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG4gIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhxdWVyeSkuc29ydCgpKSB7XG4gICAgaWYgKGtleS50b0xvd2VyQ2FzZSgpID09PSBTSUdOQVRVUkVfSEVBREVSKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBrZXlzLnB1c2goa2V5KTtcbiAgICBjb25zdCB2YWx1ZSA9IHF1ZXJ5W2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgc2VyaWFsaXplZFtrZXldID0gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGtleSl9PSR7ZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgICB2YWx1ZVxuICAgICAgKX1gO1xuICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIHNlcmlhbGl6ZWRba2V5XSA9IHZhbHVlXG4gICAgICAgIC5zbGljZSgwKVxuICAgICAgICAuc29ydCgpXG4gICAgICAgIC5yZWR1Y2UoXG4gICAgICAgICAgKGVuY29kZWQ6IEFycmF5PHN0cmluZz4sIHZhbHVlOiBzdHJpbmcpID0+XG4gICAgICAgICAgICBlbmNvZGVkLmNvbmNhdChbXG4gICAgICAgICAgICAgIGAke2VuY29kZVVSSUNvbXBvbmVudChrZXkpfT0ke2VuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSl9YFxuICAgICAgICAgICAgXSksXG4gICAgICAgICAgW11cbiAgICAgICAgKVxuICAgICAgICAuam9pbihcIiZcIik7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGtleXNcbiAgICAubWFwKGtleSA9PiBzZXJpYWxpemVkW2tleV0pXG4gICAgLmZpbHRlcihzZXJpYWxpemVkID0+IHNlcmlhbGl6ZWQpIC8vIG9taXQgYW55IGZhbHN5IHZhbHVlc1xuICAgIC5qb2luKFwiJlwiKTtcbn1cbiJdfQ==

/***/ }),

/***/ 466:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const constants_1 = __webpack_require__(13248);
const is_array_buffer_1 = __webpack_require__(47749);
const util_hex_encoding_1 = __webpack_require__(72155);
/**
 * @internal
 */
async function getPayloadHash({ headers, body }, hashConstructor) {
    for (const headerName of Object.keys(headers)) {
        if (headerName.toLowerCase() === constants_1.SHA256_HEADER) {
            return headers[headerName];
        }
    }
    if (body == undefined) {
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    }
    else if (typeof body === "string" ||
        ArrayBuffer.isView(body) ||
        is_array_buffer_1.isArrayBuffer(body)) {
        const hashCtor = new hashConstructor();
        hashCtor.update(body);
        return util_hex_encoding_1.toHex(await hashCtor.digest());
    }
    // As any defined body that is not a string or binary data is a stream, this
    // body is unsignable. Attempt to send the request with an unsigned payload,
    // which may or may not be accepted by the service.
    return constants_1.UNSIGNED_PAYLOAD;
}
exports.getPayloadHash = getPayloadHash;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0UGF5bG9hZEhhc2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZ2V0UGF5bG9hZEhhc2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyQ0FBOEQ7QUFFOUQsOERBQXlEO0FBQ3pELGtFQUFtRDtBQUVuRDs7R0FFRztBQUNJLEtBQUssVUFBVSxjQUFjLENBQ2xDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBb0IsRUFDbkMsZUFBZ0M7SUFFaEMsS0FBSyxNQUFNLFVBQVUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzdDLElBQUksVUFBVSxDQUFDLFdBQVcsRUFBRSxLQUFLLHlCQUFhLEVBQUU7WUFDOUMsT0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDNUI7S0FDRjtJQUVELElBQUksSUFBSSxJQUFJLFNBQVMsRUFBRTtRQUNyQixPQUFPLGtFQUFrRSxDQUFDO0tBQzNFO1NBQU0sSUFDTCxPQUFPLElBQUksS0FBSyxRQUFRO1FBQ3hCLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hCLCtCQUFhLENBQUMsSUFBSSxDQUFDLEVBQ25CO1FBQ0EsTUFBTSxRQUFRLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUN2QyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3RCLE9BQU8seUJBQUssQ0FBQyxNQUFNLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0tBQ3ZDO0lBRUQsNEVBQTRFO0lBQzVFLDRFQUE0RTtJQUM1RSxtREFBbUQ7SUFDbkQsT0FBTyw0QkFBZ0IsQ0FBQztBQUMxQixDQUFDO0FBMUJELHdDQTBCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFNIQTI1Nl9IRUFERVIsIFVOU0lHTkVEX1BBWUxPQUQgfSBmcm9tIFwiLi9jb25zdGFudHNcIjtcbmltcG9ydCB7IEhhc2hDb25zdHJ1Y3RvciwgSHR0cFJlcXVlc3QgfSBmcm9tIFwiQGF3cy1zZGsvdHlwZXNcIjtcbmltcG9ydCB7IGlzQXJyYXlCdWZmZXIgfSBmcm9tIFwiQGF3cy1zZGsvaXMtYXJyYXktYnVmZmVyXCI7XG5pbXBvcnQgeyB0b0hleCB9IGZyb20gXCJAYXdzLXNkay91dGlsLWhleC1lbmNvZGluZ1wiO1xuXG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UGF5bG9hZEhhc2goXG4gIHsgaGVhZGVycywgYm9keSB9OiBIdHRwUmVxdWVzdDxhbnk+LFxuICBoYXNoQ29uc3RydWN0b3I6IEhhc2hDb25zdHJ1Y3RvclxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgZm9yIChjb25zdCBoZWFkZXJOYW1lIG9mIE9iamVjdC5rZXlzKGhlYWRlcnMpKSB7XG4gICAgaWYgKGhlYWRlck5hbWUudG9Mb3dlckNhc2UoKSA9PT0gU0hBMjU2X0hFQURFUikge1xuICAgICAgcmV0dXJuIGhlYWRlcnNbaGVhZGVyTmFtZV07XG4gICAgfVxuICB9XG5cbiAgaWYgKGJvZHkgPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFwiZTNiMGM0NDI5OGZjMWMxNDlhZmJmNGM4OTk2ZmI5MjQyN2FlNDFlNDY0OWI5MzRjYTQ5NTk5MWI3ODUyYjg1NVwiO1xuICB9IGVsc2UgaWYgKFxuICAgIHR5cGVvZiBib2R5ID09PSBcInN0cmluZ1wiIHx8XG4gICAgQXJyYXlCdWZmZXIuaXNWaWV3KGJvZHkpIHx8XG4gICAgaXNBcnJheUJ1ZmZlcihib2R5KVxuICApIHtcbiAgICBjb25zdCBoYXNoQ3RvciA9IG5ldyBoYXNoQ29uc3RydWN0b3IoKTtcbiAgICBoYXNoQ3Rvci51cGRhdGUoYm9keSk7XG4gICAgcmV0dXJuIHRvSGV4KGF3YWl0IGhhc2hDdG9yLmRpZ2VzdCgpKTtcbiAgfVxuXG4gIC8vIEFzIGFueSBkZWZpbmVkIGJvZHkgdGhhdCBpcyBub3QgYSBzdHJpbmcgb3IgYmluYXJ5IGRhdGEgaXMgYSBzdHJlYW0sIHRoaXNcbiAgLy8gYm9keSBpcyB1bnNpZ25hYmxlLiBBdHRlbXB0IHRvIHNlbmQgdGhlIHJlcXVlc3Qgd2l0aCBhbiB1bnNpZ25lZCBwYXlsb2FkLFxuICAvLyB3aGljaCBtYXkgb3IgbWF5IG5vdCBiZSBhY2NlcHRlZCBieSB0aGUgc2VydmljZS5cbiAgcmV0dXJuIFVOU0lHTkVEX1BBWUxPQUQ7XG59XG4iXX0=

/***/ }),

/***/ 36725:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function hasHeader(soughtHeader, headers) {
    soughtHeader = soughtHeader.toLowerCase();
    for (const headerName of Object.keys(headers)) {
        if (soughtHeader === headerName.toLowerCase()) {
            return true;
        }
    }
    return false;
}
exports.hasHeader = hasHeader;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGFzSGVhZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2hhc0hlYWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLFNBQWdCLFNBQVMsQ0FBQyxZQUFvQixFQUFFLE9BQWtCO0lBQ2hFLFlBQVksR0FBRyxZQUFZLENBQUMsV0FBVyxFQUFFLENBQUM7SUFDMUMsS0FBSyxNQUFNLFVBQVUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzdDLElBQUksWUFBWSxLQUFLLFVBQVUsQ0FBQyxXQUFXLEVBQUUsRUFBRTtZQUM3QyxPQUFPLElBQUksQ0FBQztTQUNiO0tBQ0Y7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFURCw4QkFTQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEhlYWRlckJhZyB9IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gaGFzSGVhZGVyKHNvdWdodEhlYWRlcjogc3RyaW5nLCBoZWFkZXJzOiBIZWFkZXJCYWcpOiBib29sZWFuIHtcbiAgc291Z2h0SGVhZGVyID0gc291Z2h0SGVhZGVyLnRvTG93ZXJDYXNlKCk7XG4gIGZvciAoY29uc3QgaGVhZGVyTmFtZSBvZiBPYmplY3Qua2V5cyhoZWFkZXJzKSkge1xuICAgIGlmIChzb3VnaHRIZWFkZXIgPT09IGhlYWRlck5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19

/***/ }),

/***/ 18550:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(27639), exports);
tslib_1.__exportStar(__webpack_require__(21439), exports);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaUVBQXVDO0FBQ3ZDLHdEQUE4QiIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gXCIuL2NyZWRlbnRpYWxEZXJpdmF0aW9uXCI7XG5leHBvcnQgKiBmcm9tIFwiLi9TaWduYXR1cmVWNFwiO1xuIl19

/***/ }),

/***/ 16764:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const cloneRequest_1 = __webpack_require__(45155);
/**
 * @internal
 */
function moveHeadersToQuery(request) {
    const { headers, query = {} } = cloneRequest_1.cloneRequest(request);
    for (let name of Object.keys(headers)) {
        const lname = name.toLowerCase();
        if (lname.substr(0, 6) === "x-amz-") {
            query[name] = headers[name];
            delete headers[name];
        }
    }
    return Object.assign({}, request, { headers,
        query });
}
exports.moveHeadersToQuery = moveHeadersToQuery;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW92ZUhlYWRlcnNUb1F1ZXJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL21vdmVIZWFkZXJzVG9RdWVyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLGlEQUE4QztBQUc5Qzs7R0FFRztBQUNILFNBQWdCLGtCQUFrQixDQUNoQyxPQUFnQztJQUVoQyxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssR0FBRyxFQUF1QixFQUFFLEdBQUcsMkJBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMzRSxLQUFLLElBQUksSUFBSSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDckMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssUUFBUSxFQUFFO1lBQ25DLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdEI7S0FDRjtJQUVELHlCQUNLLE9BQU8sSUFDVixPQUFPO1FBQ1AsS0FBSyxJQUNMO0FBQ0osQ0FBQztBQWpCRCxnREFpQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjbG9uZVJlcXVlc3QgfSBmcm9tIFwiLi9jbG9uZVJlcXVlc3RcIjtcbmltcG9ydCB7IEh0dHBSZXF1ZXN0LCBRdWVyeVBhcmFtZXRlckJhZyB9IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZUhlYWRlcnNUb1F1ZXJ5PFN0cmVhbVR5cGU+KFxuICByZXF1ZXN0OiBIdHRwUmVxdWVzdDxTdHJlYW1UeXBlPlxuKTogSHR0cFJlcXVlc3Q8U3RyZWFtVHlwZT4gJiB7IHF1ZXJ5OiBRdWVyeVBhcmFtZXRlckJhZyB9IHtcbiAgY29uc3QgeyBoZWFkZXJzLCBxdWVyeSA9IHt9IGFzIFF1ZXJ5UGFyYW1ldGVyQmFnIH0gPSBjbG9uZVJlcXVlc3QocmVxdWVzdCk7XG4gIGZvciAobGV0IG5hbWUgb2YgT2JqZWN0LmtleXMoaGVhZGVycykpIHtcbiAgICBjb25zdCBsbmFtZSA9IG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICBpZiAobG5hbWUuc3Vic3RyKDAsIDYpID09PSBcIngtYW16LVwiKSB7XG4gICAgICBxdWVyeVtuYW1lXSA9IGhlYWRlcnNbbmFtZV07XG4gICAgICBkZWxldGUgaGVhZGVyc1tuYW1lXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC4uLnJlcXVlc3QsXG4gICAgaGVhZGVycyxcbiAgICBxdWVyeVxuICB9O1xufVxuIl19

/***/ }),

/***/ 5475:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const cloneRequest_1 = __webpack_require__(45155);
const constants_1 = __webpack_require__(13248);
/**
 * @internal
 */
function prepareRequest(request) {
    // Create a clone of the request object that does not clone the body
    request = cloneRequest_1.cloneRequest(request);
    for (let headerName of Object.keys(request.headers)) {
        if (constants_1.GENERATED_HEADERS.indexOf(headerName.toLowerCase()) > -1) {
            delete request.headers[headerName];
        }
    }
    if (!(constants_1.HOST_HEADER in request.headers)) {
        request.headers[constants_1.HOST_HEADER] = request.hostname;
    }
    return request;
}
exports.prepareRequest = prepareRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlcGFyZVJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvcHJlcGFyZVJlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxpREFBOEM7QUFDOUMsMkNBQTZEO0FBRTdEOztHQUVHO0FBQ0gsU0FBZ0IsY0FBYyxDQUM1QixPQUFnQztJQUVoQyxvRUFBb0U7SUFDcEUsT0FBTyxHQUFHLDJCQUFZLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFaEMsS0FBSyxJQUFJLFVBQVUsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUNuRCxJQUFJLDZCQUFpQixDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtZQUM1RCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDcEM7S0FDRjtJQUVELElBQUksQ0FBQyxDQUFDLHVCQUFXLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ3JDLE9BQU8sQ0FBQyxPQUFPLENBQUMsdUJBQVcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUM7S0FDakQ7SUFFRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBakJELHdDQWlCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEh0dHBSZXF1ZXN0IH0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5pbXBvcnQgeyBjbG9uZVJlcXVlc3QgfSBmcm9tIFwiLi9jbG9uZVJlcXVlc3RcIjtcbmltcG9ydCB7IEdFTkVSQVRFRF9IRUFERVJTLCBIT1NUX0hFQURFUiB9IGZyb20gXCIuL2NvbnN0YW50c1wiO1xuXG4vKipcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJlcGFyZVJlcXVlc3Q8U3RyZWFtVHlwZT4oXG4gIHJlcXVlc3Q6IEh0dHBSZXF1ZXN0PFN0cmVhbVR5cGU+XG4pOiBIdHRwUmVxdWVzdDxTdHJlYW1UeXBlPiB7XG4gIC8vIENyZWF0ZSBhIGNsb25lIG9mIHRoZSByZXF1ZXN0IG9iamVjdCB0aGF0IGRvZXMgbm90IGNsb25lIHRoZSBib2R5XG4gIHJlcXVlc3QgPSBjbG9uZVJlcXVlc3QocmVxdWVzdCk7XG5cbiAgZm9yIChsZXQgaGVhZGVyTmFtZSBvZiBPYmplY3Qua2V5cyhyZXF1ZXN0LmhlYWRlcnMpKSB7XG4gICAgaWYgKEdFTkVSQVRFRF9IRUFERVJTLmluZGV4T2YoaGVhZGVyTmFtZS50b0xvd2VyQ2FzZSgpKSA+IC0xKSB7XG4gICAgICBkZWxldGUgcmVxdWVzdC5oZWFkZXJzW2hlYWRlck5hbWVdO1xuICAgIH1cbiAgfVxuXG4gIGlmICghKEhPU1RfSEVBREVSIGluIHJlcXVlc3QuaGVhZGVycykpIHtcbiAgICByZXF1ZXN0LmhlYWRlcnNbSE9TVF9IRUFERVJdID0gcmVxdWVzdC5ob3N0bmFtZTtcbiAgfVxuXG4gIHJldHVybiByZXF1ZXN0O1xufVxuIl19

/***/ }),

/***/ 55824:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function signingMiddleware(signer) {
    var _this = this;
    return function (next) { return function (args) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a, _b, _c;
        return tslib_1.__generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _a = next;
                    _b = [{}, args];
                    _c = {};
                    return [4 /*yield*/, signer.sign(args.request)];
                case 1: return [2 /*return*/, _a.apply(void 0, [tslib_1.__assign.apply(void 0, _b.concat([(_c.request = _d.sent(), _c)]))])];
            }
        });
    }); }; };
}
exports.signingMiddleware = signingMiddleware;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBT0EsU0FBZ0IsaUJBQWlCLENBSS9CLE1BQXFCO0lBSnZCLGlCQWNDO0lBVEMsT0FBTyxVQUNMLElBQTRDLElBQ0QsT0FBQSxVQUMzQyxJQUE2Qzs7Ozs7b0JBRTdDLEtBQUEsSUFBSSxDQUFBOzhCQUNDLElBQUk7O29CQUNFLHFCQUFNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFBO3dCQUYxQyxzQkFBQSw2REFFRSxVQUFPLEdBQUUsU0FBK0IsVUFDeEMsRUFBQTs7O1NBQUEsRUFOeUMsQ0FNekMsQ0FBQztBQUNQLENBQUM7QUFkRCw4Q0FjQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIEZpbmFsaXplSGFuZGxlcixcbiAgRmluYWxpemVIYW5kbGVyQXJndW1lbnRzLFxuICBGaW5hbGl6ZU1pZGRsZXdhcmUsXG4gIFJlcXVlc3RTaWduZXJcbn0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBzaWduaW5nTWlkZGxld2FyZTxcbiAgSW5wdXQgZXh0ZW5kcyBvYmplY3QsXG4gIE91dHB1dCBleHRlbmRzIG9iamVjdCxcbiAgU3RyZWFtID0gVWludDhBcnJheVxuPihzaWduZXI6IFJlcXVlc3RTaWduZXIpOiBGaW5hbGl6ZU1pZGRsZXdhcmU8SW5wdXQsIE91dHB1dCwgU3RyZWFtPiB7XG4gIHJldHVybiAoXG4gICAgbmV4dDogRmluYWxpemVIYW5kbGVyPElucHV0LCBPdXRwdXQsIFN0cmVhbT5cbiAgKTogRmluYWxpemVIYW5kbGVyPElucHV0LCBPdXRwdXQsIFN0cmVhbT4gPT4gYXN5bmMgKFxuICAgIGFyZ3M6IEZpbmFsaXplSGFuZGxlckFyZ3VtZW50czxJbnB1dCwgU3RyZWFtPlxuICApOiBQcm9taXNlPE91dHB1dD4gPT5cbiAgICBuZXh0KHtcbiAgICAgIC4uLmFyZ3MsXG4gICAgICByZXF1ZXN0OiBhd2FpdCBzaWduZXIuc2lnbihhcmdzLnJlcXVlc3QpXG4gICAgfSk7XG59XG4iXX0=

/***/ }),

/***/ 17845:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
function ssecMiddleware(_a) {
    var _this = this;
    var utf8Decoder = _a.utf8Decoder, base64Encoder = _a.base64Encoder, hashConstructor = _a.hashConstructor, ssecProperties = _a.ssecProperties;
    return function (next, context) { return function (_a) {
        var input = _a.input;
        return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var e_1, _b, _c, _d, _e, sourceProperty, value, _f, targetProperty, hashTargetProperty, valueView, encoded, hash, _g, _h, _j, e_1_1;
            return tslib_1.__generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        _k.trys.push([0, 5, 6, 7]);
                        _d = tslib_1.__values(Object.keys(ssecProperties)), _e = _d.next();
                        _k.label = 1;
                    case 1:
                        if (!!_e.done) return [3 /*break*/, 4];
                        sourceProperty = _e.value;
                        value = input[sourceProperty];
                        if (!value) return [3 /*break*/, 3];
                        _f = ssecProperties[sourceProperty], targetProperty = _f.targetProperty, hashTargetProperty = _f.hashTargetProperty;
                        valueView = ArrayBuffer.isView(value)
                            ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
                            : typeof value === "string"
                                ? utf8Decoder(value)
                                : new Uint8Array(value);
                        encoded = base64Encoder(valueView);
                        hash = new hashConstructor();
                        hash.update(valueView);
                        _g = [{}, input];
                        _c = {}, _c[targetProperty] = encoded;
                        _h = hashTargetProperty;
                        _j = base64Encoder;
                        return [4 /*yield*/, hash.digest()];
                    case 2:
                        input = tslib_1.__assign.apply(void 0, _g.concat([(_c[_h] = _j.apply(void 0, [_k.sent()]), _c)]));
                        _k.label = 3;
                    case 3:
                        _e = _d.next();
                        return [3 /*break*/, 1];
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        e_1_1 = _k.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 7];
                    case 6:
                        try {
                            if (_e && !_e.done && (_b = _d.return)) _b.call(_d);
                        }
                        finally { if (e_1) throw e_1.error; }
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/, next({
                            input: input
                        })];
                }
            });
        });
    }; };
}
exports.ssecMiddleware = ssecMiddleware;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBeUJBLFNBQWdCLGNBQWMsQ0FBdUIsRUFLaEI7SUFMckMsaUJBc0NDO1FBckNDLDRCQUFXLEVBQ1gsZ0NBQWEsRUFDYixvQ0FBZSxFQUNmLGtDQUFjO0lBRWQsT0FBTyxVQUNMLElBQTRCLEVBQzVCLE9BQWdDLElBQ0wsT0FBQSxVQUFPLEVBRVY7WUFEeEIsZ0JBQUs7Ozs7Ozs7d0JBRXdCLEtBQUEsaUJBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQTs7Ozt3QkFBN0MsY0FBYzt3QkFDakIsS0FBSyxHQUE0QixLQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7NkJBQ2pFLEtBQUssRUFBTCx3QkFBSzt3QkFDRCxLQUEwQyxjQUFzQixDQUNwRSxjQUFjLENBQ2YsRUFGTyxjQUFjLG9CQUFBLEVBQUUsa0JBQWtCLHdCQUFBLENBRXhDO3dCQUNJLFNBQVMsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzs0QkFDekMsQ0FBQyxDQUFDLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDOzRCQUNsRSxDQUFDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUTtnQ0FDM0IsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7Z0NBQ3BCLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzt3QkFDcEIsT0FBTyxHQUFHLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQzt3QkFDbkMsSUFBSSxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7d0JBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7a0NBRWpCLEtBQWE7b0NBQ2hCLGNBQWMsSUFBRyxPQUFPO3dCQUN4QixLQUFBLGtCQUFrQixDQUFBO3dCQUFHLEtBQUEsYUFBYSxDQUFBO3dCQUFDLHFCQUFNLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBQTs7d0JBSHpELEtBQUssdURBR21CLGtCQUFjLFNBQW1CLEVBQUMsUUFDekQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs0QkFJTixzQkFBTyxJQUFJLENBQUM7NEJBQ1YsS0FBSyxPQUFBO3lCQUNOLENBQUMsRUFBQzs7OztLQUNKLEVBNUI0QixDQTRCNUIsQ0FBQztBQUNKLENBQUM7QUF0Q0Qsd0NBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgRGVjb2RlcixcbiAgRW5jb2RlcixcbiAgSGFuZGxlcixcbiAgSGFuZGxlckFyZ3VtZW50cyxcbiAgSGFuZGxlckV4ZWN1dGlvbkNvbnRleHQsXG4gIEhhc2gsXG4gIE1pZGRsZXdhcmUsXG4gIFNvdXJjZURhdGFcbn0gZnJvbSBcIkBhd3Mtc2RrL3R5cGVzXCI7XG5cbmV4cG9ydCB0eXBlIFNzZWNQcm9wZXJ0aWVzQ29uZmlndXJhdGlvbjxJbnB1dCBleHRlbmRzIG9iamVjdD4gPSB7XG4gIFtzb3VyY2VQcm9wZXJ0eSBpbiBrZXlvZiBJbnB1dF0/OiB7XG4gICAgdGFyZ2V0UHJvcGVydHk6IHN0cmluZztcbiAgICBoYXNoVGFyZ2V0UHJvcGVydHk6IHN0cmluZztcbiAgfTtcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3NlY01pZGRsZXdhcmVDb25maWd1cmF0aW9uPElucHV0IGV4dGVuZHMgb2JqZWN0PiB7XG4gIHV0ZjhEZWNvZGVyOiBEZWNvZGVyO1xuICBiYXNlNjRFbmNvZGVyOiBFbmNvZGVyO1xuICBoYXNoQ29uc3RydWN0b3I6IHsgbmV3ICgpOiBIYXNoIH07XG4gIHNzZWNQcm9wZXJ0aWVzOiBTc2VjUHJvcGVydGllc0NvbmZpZ3VyYXRpb248SW5wdXQ+O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3NlY01pZGRsZXdhcmU8SW5wdXQgZXh0ZW5kcyBvYmplY3Q+KHtcbiAgdXRmOERlY29kZXIsXG4gIGJhc2U2NEVuY29kZXIsXG4gIGhhc2hDb25zdHJ1Y3RvcixcbiAgc3NlY1Byb3BlcnRpZXNcbn06IFNzZWNNaWRkbGV3YXJlQ29uZmlndXJhdGlvbjxJbnB1dD4pOiBNaWRkbGV3YXJlPElucHV0LCBhbnk+IHtcbiAgcmV0dXJuIDxPdXRwdXQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgIG5leHQ6IEhhbmRsZXI8SW5wdXQsIE91dHB1dD4sXG4gICAgY29udGV4dDogSGFuZGxlckV4ZWN1dGlvbkNvbnRleHRcbiAgKTogSGFuZGxlcjxJbnB1dCwgT3V0cHV0PiA9PiBhc3luYyAoe1xuICAgIGlucHV0XG4gIH06IEhhbmRsZXJBcmd1bWVudHM8SW5wdXQ+KTogUHJvbWlzZTxPdXRwdXQ+ID0+IHtcbiAgICBmb3IgKGNvbnN0IHNvdXJjZVByb3BlcnR5IG9mIE9iamVjdC5rZXlzKHNzZWNQcm9wZXJ0aWVzKSkge1xuICAgICAgY29uc3QgdmFsdWU6IFNvdXJjZURhdGEgfCB1bmRlZmluZWQgPSAoaW5wdXQgYXMgYW55KVtzb3VyY2VQcm9wZXJ0eV07XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgY29uc3QgeyB0YXJnZXRQcm9wZXJ0eSwgaGFzaFRhcmdldFByb3BlcnR5IH0gPSAoc3NlY1Byb3BlcnRpZXMgYXMgYW55KVtcbiAgICAgICAgICBzb3VyY2VQcm9wZXJ0eVxuICAgICAgICBdO1xuICAgICAgICBjb25zdCB2YWx1ZVZpZXcgPSBBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpXG4gICAgICAgICAgPyBuZXcgVWludDhBcnJheSh2YWx1ZS5idWZmZXIsIHZhbHVlLmJ5dGVPZmZzZXQsIHZhbHVlLmJ5dGVMZW5ndGgpXG4gICAgICAgICAgOiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCJcbiAgICAgICAgICA/IHV0ZjhEZWNvZGVyKHZhbHVlKVxuICAgICAgICAgIDogbmV3IFVpbnQ4QXJyYXkodmFsdWUpO1xuICAgICAgICBjb25zdCBlbmNvZGVkID0gYmFzZTY0RW5jb2Rlcih2YWx1ZVZpZXcpO1xuICAgICAgICBjb25zdCBoYXNoID0gbmV3IGhhc2hDb25zdHJ1Y3RvcigpO1xuICAgICAgICBoYXNoLnVwZGF0ZSh2YWx1ZVZpZXcpO1xuICAgICAgICBpbnB1dCA9IHtcbiAgICAgICAgICAuLi4oaW5wdXQgYXMgYW55KSxcbiAgICAgICAgICBbdGFyZ2V0UHJvcGVydHldOiBlbmNvZGVkLFxuICAgICAgICAgIFtoYXNoVGFyZ2V0UHJvcGVydHldOiBiYXNlNjRFbmNvZGVyKGF3YWl0IGhhc2guZGlnZXN0KCkpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5leHQoe1xuICAgICAgaW5wdXRcbiAgICB9KTtcbiAgfTtcbn1cbiJdfQ==

/***/ }),

/***/ 39058:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const stream_1 = __webpack_require__(92413);
class Collector extends stream_1.Writable {
    constructor() {
        super(...arguments);
        this.bufferedBytes = [];
    }
    _write(chunk, encoding, callback) {
        this.bufferedBytes.push(chunk);
        callback();
    }
}
exports.Collector = Collector;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29sbGVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2NvbGxlY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFrQztBQUNsQyxNQUFhLFNBQVUsU0FBUSxpQkFBUTtJQUF2Qzs7UUFDa0Isa0JBQWEsR0FBYSxFQUFFLENBQUM7SUFLL0MsQ0FBQztJQUpDLE1BQU0sQ0FBQyxLQUFhLEVBQUUsUUFBZ0IsRUFBRSxRQUErQjtRQUNyRSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQixRQUFRLEVBQUUsQ0FBQztJQUNiLENBQUM7Q0FDRjtBQU5ELDhCQU1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgV3JpdGFibGUgfSBmcm9tIFwic3RyZWFtXCI7XG5leHBvcnQgY2xhc3MgQ29sbGVjdG9yIGV4dGVuZHMgV3JpdGFibGUge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVmZmVyZWRCeXRlczogQnVmZmVyW10gPSBbXTtcbiAgX3dyaXRlKGNodW5rOiBCdWZmZXIsIGVuY29kaW5nOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyPzogRXJyb3IpID0+IHZvaWQpIHtcbiAgICB0aGlzLmJ1ZmZlcmVkQnl0ZXMucHVzaChjaHVuayk7XG4gICAgY2FsbGJhY2soKTtcbiAgfVxufVxuIl19

/***/ }),

/***/ 18188:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const collector_1 = __webpack_require__(39058);
exports.streamCollector = function streamCollector(stream) {
    return new Promise((resolve, reject) => {
        const collector = new collector_1.Collector();
        stream.pipe(collector);
        stream.on("error", err => {
            // if the source errors, the destination stream needs to manually end
            collector.end();
            reject(err);
        });
        collector.on("error", reject);
        collector.on("finish", function () {
            const bytes = new Uint8Array(Buffer.concat(this.bufferedBytes));
            resolve(bytes);
        });
    });
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFFQSwyQ0FBd0M7QUFFM0IsUUFBQSxlQUFlLEdBQThCLFNBQVMsZUFBZSxDQUNoRixNQUFNO0lBRU4sT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxNQUFNLFNBQVMsR0FBRyxJQUFJLHFCQUFTLEVBQUUsQ0FBQztRQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZCLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLHFFQUFxRTtZQUNyRSxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDaEIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2QsQ0FBQyxDQUFDLENBQUM7UUFDSCxTQUFTLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUM5QixTQUFTLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtZQUNyQixNQUFNLEtBQUssR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVhZGFibGUgfSBmcm9tIFwic3RyZWFtXCI7XG5pbXBvcnQgeyBTdHJlYW1Db2xsZWN0b3IgfSBmcm9tIFwiQGF3cy1zZGsvdHlwZXNcIjtcbmltcG9ydCB7IENvbGxlY3RvciB9IGZyb20gXCIuL2NvbGxlY3RvclwiO1xuXG5leHBvcnQgY29uc3Qgc3RyZWFtQ29sbGVjdG9yOiBTdHJlYW1Db2xsZWN0b3I8UmVhZGFibGU+ID0gZnVuY3Rpb24gc3RyZWFtQ29sbGVjdG9yKFxuICBzdHJlYW1cbik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IGNvbGxlY3RvciA9IG5ldyBDb2xsZWN0b3IoKTtcbiAgICBzdHJlYW0ucGlwZShjb2xsZWN0b3IpO1xuICAgIHN0cmVhbS5vbihcImVycm9yXCIsIGVyciA9PiB7XG4gICAgICAvLyBpZiB0aGUgc291cmNlIGVycm9ycywgdGhlIGRlc3RpbmF0aW9uIHN0cmVhbSBuZWVkcyB0byBtYW51YWxseSBlbmRcbiAgICAgIGNvbGxlY3Rvci5lbmQoKTtcbiAgICAgIHJlamVjdChlcnIpO1xuICAgIH0pO1xuICAgIGNvbGxlY3Rvci5vbihcImVycm9yXCIsIHJlamVjdCk7XG4gICAgY29sbGVjdG9yLm9uKFwiZmluaXNoXCIsIGZ1bmN0aW9uKHRoaXM6IENvbGxlY3Rvcikge1xuICAgICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShCdWZmZXIuY29uY2F0KHRoaXMuYnVmZmVyZWRCeXRlcykpO1xuICAgICAgcmVzb2x2ZShieXRlcyk7XG4gICAgfSk7XG4gIH0pO1xufTtcbiJdfQ==

/***/ }),

/***/ 4560:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const querystring_parser_1 = __webpack_require__(93292);
const url_1 = __webpack_require__(78835);
exports.parseUrl = (url) => {
    const { hostname = "localhost", pathname = "/", port, protocol = "https:", search } = url_1.parse(url);
    let query;
    if (search) {
        query = querystring_parser_1.parseQueryString(search);
    }
    return {
        hostname,
        port: port ? parseInt(port) : undefined,
        protocol,
        path: pathname,
        query
    };
};
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 31906:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const util_buffer_from_1 = __webpack_require__(65574);
/**
 * Converts a base-64 encoded string to a Uint8Array of bytes using Node.JS's
 * `buffer` module.
 *
 * @param input The base-64 encoded string
 */
function fromBase64(input) {
    const buffer = util_buffer_from_1.fromString(input, "base64");
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
exports.fromBase64 = fromBase64;
/**
 * Converts a Uint8Array of binary data to a base-64 encoded string using
 * Node.JS's `buffer` module.
 *
 * @param input The binary data to encode
 */
function toBase64(input) {
    return util_buffer_from_1.fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("base64");
}
exports.toBase64 = toBase64;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 55479:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const fs_1 = __webpack_require__(35747);
function calculateBodyLength(body) {
    if (!body) {
        return 0;
    }
    if (typeof body === "string") {
        return Buffer.from(body).length;
    }
    else if (typeof body.byteLength === "number") {
        // handles Uint8Array, ArrayBuffer, Buffer, and ArrayBufferView
        return body.byteLength;
    }
    else if (typeof body.size === "number") {
        return body.size;
    }
    else if (typeof body.path === "string") {
        // handles fs readable streams
        return fs_1.lstatSync(body.path).size;
    }
}
exports.calculateBodyLength = calculateBodyLength;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 65574:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var buffer_1 = __webpack_require__(64293);
var is_array_buffer_1 = __webpack_require__(47749);
function fromArrayBuffer(input, offset, length) {
    if (offset === void 0) { offset = 0; }
    if (length === void 0) { length = input.byteLength - offset; }
    if (!is_array_buffer_1.isArrayBuffer(input)) {
        throw new Error("argument passed to fromArrayBuffer was not an ArrayBuffer");
    }
    if (typeof buffer_1.Buffer.from === "function" && buffer_1.Buffer.from !== Uint8Array.from) {
        return buffer_1.Buffer.from(input, offset, length);
    }
    // Any version of node that supports the optional offset and length
    // parameters, which were added in Node 6.0.0, will support Buffer.from and
    // have already returned. Throw if offset is not 0 or if length differs from
    // the underlying buffer's length.
    if (offset !== 0 || length !== input.byteLength) {
        throw new Error("Unable to convert TypedArray to Buffer in Node " + process.version);
    }
    return new buffer_1.Buffer(input);
}
exports.fromArrayBuffer = fromArrayBuffer;
function fromString(input, encoding) {
    if (typeof input !== "string") {
        throw new Error("argument passed to fromString was not a string");
    }
    if (typeof buffer_1.Buffer.from === "function" && buffer_1.Buffer.from !== Uint8Array.from) {
        return buffer_1.Buffer.from(input, encoding);
    }
    return new buffer_1.Buffer(input, encoding);
}
exports.fromString = fromString;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 8622:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function initServiceException(error, option) {
    var name = option.name, $metadata = option.$metadata, rawException = option.rawException, message = option.message, operationName = option.operationName;
    var serviceException = error;
    serviceException.name = name || (operationName || "") + "Error";
    serviceException.message =
        message ||
            (rawException
                ? rawException.message || rawException.Message || ""
                : error.message);
    serviceException.details = rawException || {};
    serviceException.$metadata = $metadata;
    return serviceException;
}
exports.initServiceException = initServiceException;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 72155:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var SHORT_TO_HEX = {};
var HEX_TO_SHORT = {};
for (var i = 0; i < 256; i++) {
    var encodedByte = i.toString(16).toLowerCase();
    if (encodedByte.length === 1) {
        encodedByte = "0" + encodedByte;
    }
    SHORT_TO_HEX[i] = encodedByte;
    HEX_TO_SHORT[encodedByte] = i;
}
/**
 * Converts a hexadecimal encoded string to a Uint8Array of bytes.
 *
 * @param encoded The hexadecimal encoded string
 */
function fromHex(encoded) {
    if (encoded.length % 2 !== 0) {
        throw new Error("Hex encoded strings must have an even number length");
    }
    var out = new Uint8Array(encoded.length / 2);
    for (var i = 0; i < encoded.length; i += 2) {
        var encodedByte = encoded.substr(i, 2).toLowerCase();
        if (encodedByte in HEX_TO_SHORT) {
            out[i / 2] = HEX_TO_SHORT[encodedByte];
        }
        else {
            throw new Error("Cannot decode unrecognized sequence " + encodedByte + " as hexadecimal");
        }
    }
    return out;
}
exports.fromHex = fromHex;
/**
 * Converts a Uint8Array of binary data to a hexadecimal encoded string.
 *
 * @param bytes The binary data to encode
 */
function toHex(bytes) {
    var out = "";
    for (var i = 0; i < bytes.byteLength; i++) {
        out += SHORT_TO_HEX[bytes[i]];
    }
    return out;
}
exports.toHex = toHex;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 74067:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var escape_uri_1 = __webpack_require__(38958);
function escapeUriPath(uri) {
    var e_1, _a;
    var parts = [];
    try {
        for (var _b = tslib_1.__values(uri.split("/")), _c = _b.next(); !_c.done; _c = _b.next()) {
            var sub = _c.value;
            parts.push(escape_uri_1.escapeUri(sub));
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return parts.join("/");
}
exports.escapeUriPath = escapeUriPath;
//# sourceMappingURL=escape-uri-path.js.map

/***/ }),

/***/ 38958:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
function escapeUri(uri) {
    var output = encodeURIComponent(uri);
    // AWS percent-encodes some extra non-standard characters in a URI
    output = output.replace(/[!'()*]/g, hexEncode);
    return output;
}
exports.escapeUri = escapeUri;
function hexEncode(c) {
    return "%" + c
        .charCodeAt(0)
        .toString(16)
        .toUpperCase();
}
//# sourceMappingURL=escape-uri.js.map

/***/ }),

/***/ 58681:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(38958), exports);
tslib_1.__exportStar(__webpack_require__(74067), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 40185:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const process = __webpack_require__(61765);
function defaultUserAgent(packageName, packageVersion) {
    let engine = `${process.platform}/${process.version}`;
    if (process.env.AWS_EXECUTION_ENV) {
        engine += ` exec-env/${process.env.AWS_EXECUTION_ENV}`;
    }
    return `aws-sdk-nodejs-v3-${packageName}/${packageVersion} ${engine}`;
}
exports.defaultUserAgent = defaultUserAgent;
function appendToUserAgent(request, userAgentPartial) {
    request.headers["User-Agent"] += ` ${userAgentPartial}`;
}
exports.appendToUserAgent = appendToUserAgent;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxtQ0FBbUM7QUFHbkMsU0FBZ0IsZ0JBQWdCLENBQzlCLFdBQW1CLEVBQ25CLGNBQXNCO0lBRXRCLElBQUksTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDdEQsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFO1FBQ2pDLE1BQU0sSUFBSSxhQUFhLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztLQUN4RDtJQUNELE9BQU8scUJBQXFCLFdBQVcsSUFBSSxjQUFjLElBQUksTUFBTSxFQUFFLENBQUM7QUFDeEUsQ0FBQztBQVRELDRDQVNDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQy9CLE9BQW9CLEVBQ3BCLGdCQUF3QjtJQUV4QixPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksZ0JBQWdCLEVBQUUsQ0FBQztBQUMxRCxDQUFDO0FBTEQsOENBS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwcm9jZXNzIGZyb20gXCJwcm9jZXNzXCI7XG5pbXBvcnQgeyBIdHRwUmVxdWVzdCB9IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG5leHBvcnQgZnVuY3Rpb24gZGVmYXVsdFVzZXJBZ2VudChcbiAgcGFja2FnZU5hbWU6IHN0cmluZyxcbiAgcGFja2FnZVZlcnNpb246IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgbGV0IGVuZ2luZSA9IGAke3Byb2Nlc3MucGxhdGZvcm19LyR7cHJvY2Vzcy52ZXJzaW9ufWA7XG4gIGlmIChwcm9jZXNzLmVudi5BV1NfRVhFQ1VUSU9OX0VOVikge1xuICAgIGVuZ2luZSArPSBgIGV4ZWMtZW52LyR7cHJvY2Vzcy5lbnYuQVdTX0VYRUNVVElPTl9FTlZ9YDtcbiAgfVxuICByZXR1cm4gYGF3cy1zZGstbm9kZWpzLXYzLSR7cGFja2FnZU5hbWV9LyR7cGFja2FnZVZlcnNpb259ICR7ZW5naW5lfWA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRUb1VzZXJBZ2VudChcbiAgcmVxdWVzdDogSHR0cFJlcXVlc3QsXG4gIHVzZXJBZ2VudFBhcnRpYWw6IHN0cmluZ1xuKTogdm9pZCB7XG4gIHJlcXVlc3QuaGVhZGVyc1tcIlVzZXItQWdlbnRcIl0gKz0gYCAke3VzZXJBZ2VudFBhcnRpYWx9YDtcbn1cbiJdfQ==

/***/ }),

/***/ 19930:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const util_buffer_from_1 = __webpack_require__(65574);
function fromUtf8(input) {
    const buf = util_buffer_from_1.fromString(input, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}
exports.fromUtf8 = fromUtf8;
function toUtf8(input) {
    return util_buffer_from_1.fromArrayBuffer(input.buffer, input.byteOffset, input.byteLength).toString("utf8");
}
exports.toUtf8 = toUtf8;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 53419:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var is_iterable_1 = __webpack_require__(6617);
var protocol_timestamp_1 = __webpack_require__(27949);
var xml_builder_1 = __webpack_require__(9776);
var XML_NAMESPACE_PREFIX = "xmlns";
var XmlBodyBuilder = /** @class */ (function () {
    function XmlBodyBuilder(base64Encoder, utf8Decoder) {
        this.base64Encoder = base64Encoder;
        this.utf8Decoder = utf8Decoder;
    }
    XmlBodyBuilder.prototype.build = function (_a) {
        var operation = _a.operation, _b = _a.member, member = _b === void 0 ? operation.input : _b, hasPayload = _a.hasPayload, input = _a.input, memberName = _a.memberName;
        var xmlNamespace;
        var shape = member.shape;
        if (member.xmlNamespace && member.xmlNamespace.uri) {
            xmlNamespace = member.xmlNamespace;
        }
        if (hasPayload && (input === void 0 || input === null)) {
            return "";
        }
        var allowEmpty = hasPayload !== true;
        var rootName = memberName || operation.name + "Request";
        return this.toXml(member, input, rootName, allowEmpty, xmlNamespace);
    };
    XmlBodyBuilder.prototype.toXml = function (member, input, rootName, allowEmpty, xmlNamespace) {
        var rootNode = new xml_builder_1.XmlNode(rootName);
        // apply namespace if necessary
        if (xmlNamespace && xmlNamespace.uri) {
            var prefix = xmlNamespace.prefix
                ? XML_NAMESPACE_PREFIX + ":" + xmlNamespace.prefix
                : XML_NAMESPACE_PREFIX;
            rootNode.addAttribute(prefix, xmlNamespace.uri);
        }
        this.serialize(rootNode, member, input);
        return rootNode.children.length || !allowEmpty ? rootNode.toString() : "";
    };
    XmlBodyBuilder.prototype.serialize = function (node, member, input) {
        switch (member.shape.type) {
            case "structure":
                return this.serializeStructure(node, member, input);
            case "map":
                return this.serializeMap(node, member, input);
            case "list":
                return this.serializeList(node, member, input);
            case "float":
                return this.serializeFloat(node, member, input);
            case "integer":
                return this.serializeInteger(node, member, input);
            case "string":
                return this.serializeString(node, member, input);
            case "timestamp":
                return this.serializeTimestamp(node, member, input);
            case "blob":
                return this.serializeBlob(node, member, input);
            default:
                return this.serializeScalar(node, member, input);
        }
    };
    XmlBodyBuilder.prototype.serializeStructure = function (node, member, input) {
        var e_1, _a;
        // sanity check. May be undefined if input has a payload member.
        if (input === void 0 || input === null) {
            return;
        }
        var shape = member.shape;
        try {
            for (var _b = tslib_1.__values(Object.keys(shape.members)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var memberName = _c.value;
                var inputValue = input[memberName];
                if (typeof inputValue === "undefined" || inputValue === null) {
                    continue;
                }
                var structureMember = shape.members[memberName];
                var _d = structureMember.flattened, flattened = _d === void 0 ? structureMember.shape.flattened : _d, location = structureMember.location, _e = structureMember.locationName, locationName = _e === void 0 ? memberName : _e, xmlAttribute = structureMember.xmlAttribute, xmlNamespace = structureMember.xmlNamespace;
                // this field belongs somewhere other than the body
                if (location) {
                    continue;
                }
                var memberType = structureMember.shape.type;
                if (xmlAttribute) {
                    node.addAttribute(locationName, inputValue);
                }
                else if (flattened) {
                    this.serializeStructureMember(node, structureMember, inputValue, locationName);
                }
                else {
                    // create a new element
                    var childNode = new xml_builder_1.XmlNode(locationName);
                    if (xmlNamespace && xmlNamespace.uri) {
                        var prefix = xmlNamespace.prefix
                            ? XML_NAMESPACE_PREFIX + ":" + xmlNamespace.prefix
                            : XML_NAMESPACE_PREFIX;
                        childNode.addAttribute(prefix, xmlNamespace.uri);
                    }
                    this.serializeStructureMember(childNode, structureMember, inputValue, memberName);
                    node.addChildNode(childNode);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    XmlBodyBuilder.prototype.serializeStructureMember = function (node, structureMember, inputValue, memberName) {
        var memberType = structureMember.shape.type;
        if (memberType === "list") {
            this.serializeList(node, structureMember, inputValue, memberName);
        }
        else if (memberType === "map") {
            this.serializeMap(node, structureMember, inputValue, memberName);
        }
        else {
            this.serialize(node, structureMember, inputValue);
        }
    };
    XmlBodyBuilder.prototype.serializeMap = function (node, member, input, memberName) {
        var e_2, _a, e_3, _b;
        var name = member.locationName || memberName;
        var shape = member.shape;
        var _c = shape.flattened, flattened = _c === void 0 ? member.flattened : _c, _d = shape.key.locationName, xmlKey = _d === void 0 ? "key" : _d, _e = shape.value.locationName, xmlValue = _e === void 0 ? "value" : _e;
        if (!flattened) {
            name = "entry";
        }
        if (is_iterable_1.isIterable(input)) {
            try {
                for (var input_1 = tslib_1.__values(input), input_1_1 = input_1.next(); !input_1_1.done; input_1_1 = input_1.next()) {
                    var _f = tslib_1.__read(input_1_1.value, 2), inputKey = _f[0], inputValue = _f[1];
                    var childNode = this.formatMap(shape, name, xmlKey, xmlValue, inputKey, inputValue);
                    node.addChildNode(childNode);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (input_1_1 && !input_1_1.done && (_a = input_1.return)) _a.call(input_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
        else if (typeof input === "object" && input !== null) {
            try {
                for (var _g = tslib_1.__values(Object.keys(input)), _h = _g.next(); !_h.done; _h = _g.next()) {
                    var inputKey = _h.value;
                    var childNode = this.formatMap(shape, name, xmlKey, xmlValue, inputKey, input[inputKey]);
                    node.addChildNode(childNode);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) _b.call(_g);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        else {
            throw new Error("Unable to serialize value that is neither a [key, value]" +
                " iterable nor an object as a map");
        }
    };
    XmlBodyBuilder.prototype.formatMap = function (shape, name, xmlKey, xmlValue, inputKey, inputValue) {
        var keyNode = new xml_builder_1.XmlNode(xmlKey);
        var valueNode = new xml_builder_1.XmlNode(xmlValue);
        this.serialize(keyNode, shape.key, inputKey);
        this.serialize(valueNode, shape.value, inputValue);
        return new xml_builder_1.XmlNode(name, [keyNode, valueNode]);
    };
    XmlBodyBuilder.prototype.serializeList = function (node, member, input, memberName) {
        var e_4, _a;
        var shape = member.shape;
        var flattened = shape.flattened;
        var name = shape.member.locationName;
        if (!name) {
            name = flattened ? memberName : "member";
        }
        if (Array.isArray(input) || is_iterable_1.isIterable(input)) {
            try {
                for (var input_2 = tslib_1.__values(input), input_2_1 = input_2.next(); !input_2_1.done; input_2_1 = input_2.next()) {
                    var value = input_2_1.value;
                    var childNode = new xml_builder_1.XmlNode(name);
                    this.serialize(childNode, shape.member, value);
                    node.addChildNode(childNode);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (input_2_1 && !input_2_1.done && (_a = input_2.return)) _a.call(input_2);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
        else {
            throw new Error("Unable to serialize value that is neither an array nor an" +
                " iterable as a list");
        }
    };
    XmlBodyBuilder.prototype.serializeScalar = function (node, member, input) {
        node.addChildNode(new xml_builder_1.XmlText(input));
    };
    XmlBodyBuilder.prototype.serializeBlob = function (node, member, input) {
        if (typeof input === "string") {
            input = this.utf8Decoder(input);
        }
        node.addChildNode(new xml_builder_1.XmlText(this.base64Encoder(input)));
    };
    XmlBodyBuilder.prototype.serializeFloat = function (node, member, input) {
        node.addChildNode(new xml_builder_1.XmlText(String(parseFloat(input))));
    };
    XmlBodyBuilder.prototype.serializeInteger = function (node, member, input) {
        node.addChildNode(new xml_builder_1.XmlText(String(parseInt(input, 10))));
    };
    XmlBodyBuilder.prototype.serializeString = function (node, member, input) {
        node.addChildNode(new xml_builder_1.XmlText(input));
    };
    XmlBodyBuilder.prototype.serializeTimestamp = function (node, member, input) {
        var timestampFormat = member.timestampFormat
            ? member.timestampFormat
            : member.shape.timestampFormat;
        switch (timestampFormat) {
            case "unixTimestamp":
                node.addChildNode(new xml_builder_1.XmlText(String(protocol_timestamp_1.epoch(input))));
                break;
            case "rfc822":
                node.addChildNode(new xml_builder_1.XmlText(protocol_timestamp_1.rfc822(input)));
                break;
            default:
                node.addChildNode(new xml_builder_1.XmlText(protocol_timestamp_1.iso8601(input)));
                break;
        }
    };
    return XmlBodyBuilder;
}());
exports.XmlBodyBuilder = XmlBodyBuilder;
//# sourceMappingURL=XmlBodyBuilder.js.map

/***/ }),

/***/ 52624:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
var protocol_timestamp_1 = __webpack_require__(27949);
var pixl_xml_1 = __webpack_require__(79193);
var XmlBodyParser = /** @class */ (function () {
    function XmlBodyParser(base64Decoder) {
        this.base64Decoder = base64Decoder;
    }
    XmlBodyParser.prototype.parse = function (member, input) {
        var _a;
        var xmlObj = pixl_xml_1.parse(input, {
            preserveAttributes: true
        });
        var wrappedShape = member.shape;
        if (member.resultWrapper) {
            wrappedShape = {
                type: "structure",
                required: [],
                members: (_a = {},
                    _a[member.resultWrapper] = {
                        shape: member.shape
                    },
                    _a)
            };
        }
        var data = this.unmarshall(wrappedShape, xmlObj);
        if (member.resultWrapper) {
            data = data[member.resultWrapper];
        }
        //standard query
        if (xmlObj.ResponseMetadata && xmlObj.ResponseMetadata.RequestId) {
            data.$metadata = {
                requestId: xmlObj.ResponseMetadata.RequestId
            };
        }
        //ec2 query
        if (xmlObj.RequestId) {
            data.$metadata = {
                requestId: xmlObj.RequestId
            };
        }
        //SDB query
        if (xmlObj.RequestID) {
            data.$metadata = {
                requestId: xmlObj.RequestID
            };
        }
        return data;
    };
    XmlBodyParser.prototype.unmarshall = function (shape, xmlObj) {
        if (shape.type === "structure") {
            return this.parseStructure(shape, xmlObj);
        }
        else if (shape.type === "list") {
            return this.parseList(shape, xmlObj);
        }
        else if (shape.type === "map") {
            return this.parseMap(shape, xmlObj);
        }
        else if (shape.type === "timestamp") {
            return this.parseTimeStamp(shape, xmlObj);
        }
        else if (shape.type === "blob") {
            return typeof xmlObj === "string"
                ? this.base64Decoder(xmlObj)
                : undefined;
        }
        else if (shape.type === "boolean") {
            if (!xmlObj)
                return undefined;
            return xmlObj === "true";
        }
        else if (shape.type === "float" || shape.type === "integer") {
            if (!xmlObj) {
                return undefined;
            }
            var num = Number(xmlObj);
            return isFinite(num) ? num : undefined;
        }
        else if (shape.type === "string") {
            if (xmlObj === "") {
                return xmlObj;
            }
            return xmlObj ? xmlObj.toString() : undefined;
        }
        else {
            throw new Error(shape.type + " can not be parsed");
        }
    };
    XmlBodyParser.prototype.parseStructure = function (shape, xmlObj) {
        var e_1, _a;
        if (xmlObj === undefined) {
            return undefined;
        }
        var obj = {};
        try {
            for (var _b = tslib_1.__values(Object.keys(shape.members)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var memberName = _c.value;
                var member = shape.members[memberName];
                var xmlKey = this.mapToXMLKey(member, memberName);
                var subXmlObj = xmlObj;
                if (member.xmlAttribute) {
                    subXmlObj = xmlObj["_Attribs"];
                }
                obj[memberName] = this.unmarshall(member.shape, subXmlObj[xmlKey]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return obj;
    };
    XmlBodyParser.prototype.mapToXMLKey = function (member, name) {
        var keyName = member.locationName || name, membershape = member.shape;
        if (membershape.type === "list") {
            keyName = membershape.flattened
                ? membershape.member.locationName || keyName
                : keyName;
        }
        return keyName;
    };
    XmlBodyParser.prototype.parseList = function (shape, xmlObj) {
        var e_2, _a;
        var list = [], xmlList = xmlObj;
        if (!xmlObj || Object.keys(xmlObj).length === 0) {
            return list;
        }
        if (!Array.isArray(xmlObj)) {
            var key = shape.member.locationName || "member";
            xmlList = shape.flattened ? xmlObj : xmlObj[key];
            if (!xmlList || Object.keys(xmlList).length === 0) {
                return list;
            }
            if (!Array.isArray(xmlList)) {
                xmlList = [xmlList];
            }
        }
        try {
            for (var xmlList_1 = tslib_1.__values(xmlList), xmlList_1_1 = xmlList_1.next(); !xmlList_1_1.done; xmlList_1_1 = xmlList_1.next()) {
                var xmlObjEntry = xmlList_1_1.value;
                list.push(this.unmarshall(shape.member.shape, xmlObjEntry));
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (xmlList_1_1 && !xmlList_1_1.done && (_a = xmlList_1.return)) _a.call(xmlList_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
        return list;
    };
    XmlBodyParser.prototype.parseMap = function (shape, xmlObj) {
        var e_3, _a;
        var obj = {}, mapEntryList = xmlObj;
        if (!shape.flattened) {
            mapEntryList = xmlObj["entry"];
        }
        if (!mapEntryList || Object.keys(mapEntryList).length === 0) {
            return {};
        }
        if (!Array.isArray(mapEntryList)) {
            mapEntryList = [mapEntryList];
        }
        try {
            for (var mapEntryList_1 = tslib_1.__values(mapEntryList), mapEntryList_1_1 = mapEntryList_1.next(); !mapEntryList_1_1.done; mapEntryList_1_1 = mapEntryList_1.next()) {
                var mapEntry = mapEntryList_1_1.value;
                var keyName = shape.key.locationName || "key";
                var valueName = shape.value.locationName || "value";
                obj[mapEntry[keyName]] = this.unmarshall(shape.value.shape, mapEntry[valueName]);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (mapEntryList_1_1 && !mapEntryList_1_1.done && (_a = mapEntryList_1.return)) _a.call(mapEntryList_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
        return obj;
    };
    XmlBodyParser.prototype.parseTimeStamp = function (shape, xmlObj) {
        if (!xmlObj) {
            return undefined;
        }
        var date = protocol_timestamp_1.toDate(xmlObj);
        if (date.toString() === "Invalid Date") {
            return undefined;
        }
        return date;
    };
    return XmlBodyParser;
}());
exports.XmlBodyParser = XmlBodyParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsa0VBQXFEO0FBQ3JELCtDQUF3RTtBQTZCeEU7SUFDRSx1QkFBNkIsYUFBc0I7UUFBdEIsa0JBQWEsR0FBYixhQUFhLENBQVM7SUFBRyxDQUFDO0lBRWhELDZCQUFLLEdBQVosVUFBeUIsTUFBYyxFQUFFLEtBQWE7O1FBQ3BELElBQUksTUFBTSxHQUFtQixnQkFBUyxDQUFDLEtBQUssRUFBRTtZQUM1QyxrQkFBa0IsRUFBRSxJQUFJO1NBQ3pCLENBQUMsQ0FBQztRQUNILElBQUksWUFBWSxHQUF1QixNQUFNLENBQUMsS0FBSyxDQUFDO1FBQ3BELElBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtZQUN4QixZQUFZLEdBQUc7Z0JBQ2IsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFFBQVEsRUFBRSxFQUFFO2dCQUNaLE9BQU87b0JBQ0wsR0FBQyxNQUFNLENBQUMsYUFBYSxJQUFHO3dCQUN0QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7cUJBQ3BCO3VCQUNGO2FBQ0YsQ0FBQztTQUNIO1FBQ0QsSUFBSSxJQUFJLEdBQWUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDN0QsSUFBSSxNQUFNLENBQUMsYUFBYSxFQUFFO1lBQ3hCLElBQUksR0FBSSxJQUFZLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQzVDO1FBQ0QsZ0JBQWdCO1FBQ2hCLElBQUksTUFBTSxDQUFDLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUU7WUFDL0QsSUFBWSxDQUFDLFNBQVMsR0FBRztnQkFDeEIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTO2FBQzdDLENBQUM7U0FDSDtRQUNELFdBQVc7UUFDWCxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7WUFDbkIsSUFBWSxDQUFDLFNBQVMsR0FBRztnQkFDeEIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO2FBQzVCLENBQUM7U0FDSDtRQUNELFdBQVc7UUFDWCxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUU7WUFDbkIsSUFBWSxDQUFDLFNBQVMsR0FBRztnQkFDeEIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO2FBQzVCLENBQUM7U0FDSDtRQUNELE9BQU8sSUFBa0IsQ0FBQztJQUM1QixDQUFDO0lBRU8sa0NBQVUsR0FBbEIsVUFBbUIsS0FBeUIsRUFBRSxNQUFXO1FBQ3ZELElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMzQzthQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7WUFDaEMsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN0QzthQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxLQUFLLEVBQUU7WUFDL0IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztTQUNyQzthQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxXQUFXLEVBQUU7WUFDckMsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztTQUMzQzthQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7WUFDaEMsT0FBTyxPQUFPLE1BQU0sS0FBSyxRQUFRO2dCQUMvQixDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7Z0JBQzVCLENBQUMsQ0FBQyxTQUFTLENBQUM7U0FDZjthQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDbkMsSUFBSSxDQUFDLE1BQU07Z0JBQUUsT0FBTyxTQUFTLENBQUM7WUFDOUIsT0FBTyxNQUFNLEtBQUssTUFBTSxDQUFDO1NBQzFCO2FBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtZQUM3RCxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNYLE9BQU8sU0FBUyxDQUFDO2FBQ2xCO1lBQ0QsSUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzNCLE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztTQUN4QzthQUFNLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUU7WUFDbEMsSUFBSSxNQUFNLEtBQUssRUFBRSxFQUFFO2dCQUNqQixPQUFPLE1BQU0sQ0FBQzthQUNmO1lBQ0QsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1NBQy9DO2FBQU07WUFDTCxNQUFNLElBQUksS0FBSyxDQUFLLEtBQWEsQ0FBQyxJQUFJLHVCQUFvQixDQUFDLENBQUM7U0FDN0Q7SUFDSCxDQUFDO0lBRU8sc0NBQWMsR0FBdEIsVUFDRSxLQUFnQixFQUNoQixNQUFXOztRQUVYLElBQUksTUFBTSxLQUFLLFNBQVMsRUFBRTtZQUN4QixPQUFPLFNBQVMsQ0FBQztTQUNsQjtRQUNELElBQUksR0FBRyxHQUFlLEVBQUUsQ0FBQzs7WUFDekIsS0FBeUIsSUFBQSxLQUFBLGlCQUFBLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBLGdCQUFBLDRCQUFFO2dCQUFoRCxJQUFNLFVBQVUsV0FBQTtnQkFDbkIsSUFBTSxNQUFNLEdBQVcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDakQsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7Z0JBQ3BELElBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQztnQkFDdkIsSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFO29CQUN2QixTQUFTLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNoQztnQkFDRCxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO2FBQ3BFOzs7Ozs7Ozs7UUFDRCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFTyxtQ0FBVyxHQUFuQixVQUFvQixNQUFjLEVBQUUsSUFBWTtRQUM5QyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsWUFBWSxJQUFJLElBQUksRUFDdkMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDN0IsSUFBSSxXQUFXLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtZQUMvQixPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVM7Z0JBQzdCLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFlBQVksSUFBSSxPQUFPO2dCQUM1QyxDQUFDLENBQUMsT0FBTyxDQUFDO1NBQ2I7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRU8saUNBQVMsR0FBakIsVUFBa0IsS0FBVyxFQUFFLE1BQVc7O1FBQ3hDLElBQUksSUFBSSxHQUFpQixFQUFFLEVBQ3pCLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDbkIsSUFBSSxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDL0MsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQzFCLElBQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxJQUFJLFFBQVEsQ0FBQztZQUNsRCxPQUFPLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakQsSUFBSSxDQUFDLE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ2pELE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDM0IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDckI7U0FDRjs7WUFDRCxLQUF3QixJQUFBLFlBQUEsaUJBQUEsT0FBTyxDQUFBLGdDQUFBLHFEQUFFO2dCQUE1QixJQUFJLFdBQVcsb0JBQUE7Z0JBQ2xCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO2FBQzdEOzs7Ozs7Ozs7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFTyxnQ0FBUSxHQUFoQixVQUFpQixLQUFVLEVBQUUsTUFBVzs7UUFDdEMsSUFBSSxHQUFHLEdBQWUsRUFBRSxFQUN0QixZQUFZLEdBQUcsTUFBTSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFO1lBQ3BCLFlBQVksR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDaEM7UUFDRCxJQUFJLENBQUMsWUFBWSxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUMzRCxPQUFPLEVBQUUsQ0FBQztTQUNYO1FBQ0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDaEMsWUFBWSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDL0I7O1lBQ0QsS0FBcUIsSUFBQSxpQkFBQSxpQkFBQSxZQUFZLENBQUEsMENBQUEsb0VBQUU7Z0JBQTlCLElBQUksUUFBUSx5QkFBQTtnQkFDZixJQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUM7Z0JBQzlDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsWUFBWSxJQUFJLE9BQU8sQ0FBQztnQkFDcEQsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQ3RDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUNqQixRQUFRLENBQUMsU0FBUyxDQUFDLENBQ3BCLENBQUM7YUFDSDs7Ozs7Ozs7O1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRU8sc0NBQWMsR0FBdEIsVUFDRSxLQUFnQixFQUNoQixNQUFXO1FBRVgsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sU0FBUyxDQUFDO1NBQ2xCO1FBQ0QsSUFBSSxJQUFJLEdBQUcsMkJBQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxQixJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxjQUFjLEVBQUU7WUFDdEMsT0FBTyxTQUFTLENBQUM7U0FDbEI7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDSCxvQkFBQztBQUFELENBQUMsQUFyS0QsSUFxS0M7QUFyS1ksc0NBQWEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0b0RhdGUgfSBmcm9tIFwiQGF3cy1zZGsvcHJvdG9jb2wtdGltZXN0YW1wXCI7XG5pbXBvcnQgeyBwYXJzZSBhcyBwaXhsUGFyc2UsIFhNTFBhcnNlT3V0cHV0IH0gZnJvbSBcIi4uL3ZlbmRvci9waXhsLXhtbFwiO1xuaW1wb3J0IHtcbiAgQm9keVBhcnNlcixcbiAgRGVjb2RlcixcbiAgTWVtYmVyLFxuICBTaGFwZSxcbiAgU3RydWN0dXJlLFxuICBMaXN0LFxuICBNYXAsXG4gIEJvb2xlYW4sXG4gIEJsb2IsXG4gIFRpbWVzdGFtcCxcbiAgU2VyaWFsaXphdGlvbk1vZGVsXG59IGZyb20gXCJAYXdzLXNkay90eXBlc1wiO1xuXG50eXBlIFNjYWxhciA9IHN0cmluZyB8IG51bWJlciB8IGJvb2xlYW4gfCBudWxsO1xuXG5pbnRlcmZhY2UgT2JqZWN0VHlwZSB7XG4gIFtrZXk6IHN0cmluZ106IE9iamVjdFR5cGUgfCBTY2FsYXIgfCBPYmplY3RUeXBlQXJyYXk7XG59XG5cbmludGVyZmFjZSBQYXJzZWRSZXNwb25zZSBleHRlbmRzIFhNTFBhcnNlT3V0cHV0IHtcbiAgUmVzcG9uc2VNZXRhZGF0YTogeyBSZXF1ZXN0SWQ6IHN0cmluZyB9O1xuICBSZXF1ZXN0SWQ/OiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBPYmplY3RUeXBlQXJyYXlcbiAgZXh0ZW5kcyBBcnJheTxPYmplY3RUeXBlIHwgU2NhbGFyIHwgT2JqZWN0VHlwZUFycmF5PiB7fVxuXG5leHBvcnQgY2xhc3MgWG1sQm9keVBhcnNlciBpbXBsZW1lbnRzIEJvZHlQYXJzZXIge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGJhc2U2NERlY29kZXI6IERlY29kZXIpIHt9XG5cbiAgcHVibGljIHBhcnNlPE91dHB1dFR5cGU+KG1lbWJlcjogTWVtYmVyLCBpbnB1dDogc3RyaW5nKTogT3V0cHV0VHlwZSB7XG4gICAgbGV0IHhtbE9iaiA9IDxQYXJzZWRSZXNwb25zZT5waXhsUGFyc2UoaW5wdXQsIHtcbiAgICAgIHByZXNlcnZlQXR0cmlidXRlczogdHJ1ZVxuICAgIH0pO1xuICAgIGxldCB3cmFwcGVkU2hhcGU6IFNlcmlhbGl6YXRpb25Nb2RlbCA9IG1lbWJlci5zaGFwZTtcbiAgICBpZiAobWVtYmVyLnJlc3VsdFdyYXBwZXIpIHtcbiAgICAgIHdyYXBwZWRTaGFwZSA9IHtcbiAgICAgICAgdHlwZTogXCJzdHJ1Y3R1cmVcIixcbiAgICAgICAgcmVxdWlyZWQ6IFtdLFxuICAgICAgICBtZW1iZXJzOiB7XG4gICAgICAgICAgW21lbWJlci5yZXN1bHRXcmFwcGVyXToge1xuICAgICAgICAgICAgc2hhcGU6IG1lbWJlci5zaGFwZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gICAgbGV0IGRhdGE6IE91dHB1dFR5cGUgPSB0aGlzLnVubWFyc2hhbGwod3JhcHBlZFNoYXBlLCB4bWxPYmopO1xuICAgIGlmIChtZW1iZXIucmVzdWx0V3JhcHBlcikge1xuICAgICAgZGF0YSA9IChkYXRhIGFzIGFueSlbbWVtYmVyLnJlc3VsdFdyYXBwZXJdO1xuICAgIH1cbiAgICAvL3N0YW5kYXJkIHF1ZXJ5XG4gICAgaWYgKHhtbE9iai5SZXNwb25zZU1ldGFkYXRhICYmIHhtbE9iai5SZXNwb25zZU1ldGFkYXRhLlJlcXVlc3RJZCkge1xuICAgICAgKGRhdGEgYXMgYW55KS4kbWV0YWRhdGEgPSB7XG4gICAgICAgIHJlcXVlc3RJZDogeG1sT2JqLlJlc3BvbnNlTWV0YWRhdGEuUmVxdWVzdElkXG4gICAgICB9O1xuICAgIH1cbiAgICAvL2VjMiBxdWVyeVxuICAgIGlmICh4bWxPYmouUmVxdWVzdElkKSB7XG4gICAgICAoZGF0YSBhcyBhbnkpLiRtZXRhZGF0YSA9IHtcbiAgICAgICAgcmVxdWVzdElkOiB4bWxPYmouUmVxdWVzdElkXG4gICAgICB9O1xuICAgIH1cbiAgICAvL1NEQiBxdWVyeVxuICAgIGlmICh4bWxPYmouUmVxdWVzdElEKSB7XG4gICAgICAoZGF0YSBhcyBhbnkpLiRtZXRhZGF0YSA9IHtcbiAgICAgICAgcmVxdWVzdElkOiB4bWxPYmouUmVxdWVzdElEXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4gZGF0YSBhcyBPdXRwdXRUeXBlO1xuICB9XG5cbiAgcHJpdmF0ZSB1bm1hcnNoYWxsKHNoYXBlOiBTZXJpYWxpemF0aW9uTW9kZWwsIHhtbE9iajogYW55KTogYW55IHtcbiAgICBpZiAoc2hhcGUudHlwZSA9PT0gXCJzdHJ1Y3R1cmVcIikge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdHJ1Y3R1cmUoc2hhcGUsIHhtbE9iaik7XG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSBcImxpc3RcIikge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VMaXN0KHNoYXBlLCB4bWxPYmopO1xuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gXCJtYXBcIikge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VNYXAoc2hhcGUsIHhtbE9iaik7XG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSBcInRpbWVzdGFtcFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVRpbWVTdGFtcChzaGFwZSwgeG1sT2JqKTtcbiAgICB9IGVsc2UgaWYgKHNoYXBlLnR5cGUgPT09IFwiYmxvYlwiKSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHhtbE9iaiA9PT0gXCJzdHJpbmdcIlxuICAgICAgICA/IHRoaXMuYmFzZTY0RGVjb2Rlcih4bWxPYmopXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIGlmICgheG1sT2JqKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIHhtbE9iaiA9PT0gXCJ0cnVlXCI7XG4gICAgfSBlbHNlIGlmIChzaGFwZS50eXBlID09PSBcImZsb2F0XCIgfHwgc2hhcGUudHlwZSA9PT0gXCJpbnRlZ2VyXCIpIHtcbiAgICAgIGlmICgheG1sT2JqKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBjb25zdCBudW0gPSBOdW1iZXIoeG1sT2JqKTtcbiAgICAgIHJldHVybiBpc0Zpbml0ZShudW0pID8gbnVtIDogdW5kZWZpbmVkO1xuICAgIH0gZWxzZSBpZiAoc2hhcGUudHlwZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgaWYgKHhtbE9iaiA9PT0gXCJcIikge1xuICAgICAgICByZXR1cm4geG1sT2JqO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHhtbE9iaiA/IHhtbE9iai50b1N0cmluZygpIDogdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7KHNoYXBlIGFzIGFueSkudHlwZX0gY2FuIG5vdCBiZSBwYXJzZWRgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBhcnNlU3RydWN0dXJlKFxuICAgIHNoYXBlOiBTdHJ1Y3R1cmUsXG4gICAgeG1sT2JqOiBhbnlcbiAgKTogT2JqZWN0VHlwZSB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKHhtbE9iaiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBsZXQgb2JqOiBPYmplY3RUeXBlID0ge307XG4gICAgZm9yIChjb25zdCBtZW1iZXJOYW1lIG9mIE9iamVjdC5rZXlzKHNoYXBlLm1lbWJlcnMpKSB7XG4gICAgICBjb25zdCBtZW1iZXI6IE1lbWJlciA9IHNoYXBlLm1lbWJlcnNbbWVtYmVyTmFtZV07XG4gICAgICBjb25zdCB4bWxLZXkgPSB0aGlzLm1hcFRvWE1MS2V5KG1lbWJlciwgbWVtYmVyTmFtZSk7XG4gICAgICBsZXQgc3ViWG1sT2JqID0geG1sT2JqO1xuICAgICAgaWYgKG1lbWJlci54bWxBdHRyaWJ1dGUpIHtcbiAgICAgICAgc3ViWG1sT2JqID0geG1sT2JqW1wiX0F0dHJpYnNcIl07XG4gICAgICB9XG4gICAgICBvYmpbbWVtYmVyTmFtZV0gPSB0aGlzLnVubWFyc2hhbGwobWVtYmVyLnNoYXBlLCBzdWJYbWxPYmpbeG1sS2V5XSk7XG4gICAgfVxuICAgIHJldHVybiBvYmo7XG4gIH1cblxuICBwcml2YXRlIG1hcFRvWE1MS2V5KG1lbWJlcjogTWVtYmVyLCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCBrZXlOYW1lID0gbWVtYmVyLmxvY2F0aW9uTmFtZSB8fCBuYW1lLFxuICAgICAgbWVtYmVyc2hhcGUgPSBtZW1iZXIuc2hhcGU7XG4gICAgaWYgKG1lbWJlcnNoYXBlLnR5cGUgPT09IFwibGlzdFwiKSB7XG4gICAgICBrZXlOYW1lID0gbWVtYmVyc2hhcGUuZmxhdHRlbmVkXG4gICAgICAgID8gbWVtYmVyc2hhcGUubWVtYmVyLmxvY2F0aW9uTmFtZSB8fCBrZXlOYW1lXG4gICAgICAgIDoga2V5TmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIGtleU5hbWU7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlTGlzdChzaGFwZTogTGlzdCwgeG1sT2JqOiBhbnkpOiBPYmplY3RUeXBlQXJyYXkge1xuICAgIGxldCBsaXN0OiBPYmplY3RUeXBlW10gPSBbXSxcbiAgICAgIHhtbExpc3QgPSB4bWxPYmo7XG4gICAgaWYgKCF4bWxPYmogfHwgT2JqZWN0LmtleXMoeG1sT2JqKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoeG1sT2JqKSkge1xuICAgICAgY29uc3Qga2V5ID0gc2hhcGUubWVtYmVyLmxvY2F0aW9uTmFtZSB8fCBcIm1lbWJlclwiO1xuICAgICAgeG1sTGlzdCA9IHNoYXBlLmZsYXR0ZW5lZCA/IHhtbE9iaiA6IHhtbE9ialtrZXldO1xuICAgICAgaWYgKCF4bWxMaXN0IHx8IE9iamVjdC5rZXlzKHhtbExpc3QpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbGlzdDtcbiAgICAgIH1cbiAgICAgIGlmICghQXJyYXkuaXNBcnJheSh4bWxMaXN0KSkge1xuICAgICAgICB4bWxMaXN0ID0gW3htbExpc3RdO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGxldCB4bWxPYmpFbnRyeSBvZiB4bWxMaXN0KSB7XG4gICAgICBsaXN0LnB1c2godGhpcy51bm1hcnNoYWxsKHNoYXBlLm1lbWJlci5zaGFwZSwgeG1sT2JqRW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuICBwcml2YXRlIHBhcnNlTWFwKHNoYXBlOiBNYXAsIHhtbE9iajogYW55KTogT2JqZWN0VHlwZSB7XG4gICAgbGV0IG9iajogT2JqZWN0VHlwZSA9IHt9LFxuICAgICAgbWFwRW50cnlMaXN0ID0geG1sT2JqO1xuICAgIGlmICghc2hhcGUuZmxhdHRlbmVkKSB7XG4gICAgICBtYXBFbnRyeUxpc3QgPSB4bWxPYmpbXCJlbnRyeVwiXTtcbiAgICB9XG4gICAgaWYgKCFtYXBFbnRyeUxpc3QgfHwgT2JqZWN0LmtleXMobWFwRW50cnlMaXN0KS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG1hcEVudHJ5TGlzdCkpIHtcbiAgICAgIG1hcEVudHJ5TGlzdCA9IFttYXBFbnRyeUxpc3RdO1xuICAgIH1cbiAgICBmb3IgKGxldCBtYXBFbnRyeSBvZiBtYXBFbnRyeUxpc3QpIHtcbiAgICAgIGxldCBrZXlOYW1lID0gc2hhcGUua2V5LmxvY2F0aW9uTmFtZSB8fCBcImtleVwiO1xuICAgICAgbGV0IHZhbHVlTmFtZSA9IHNoYXBlLnZhbHVlLmxvY2F0aW9uTmFtZSB8fCBcInZhbHVlXCI7XG4gICAgICBvYmpbbWFwRW50cnlba2V5TmFtZV1dID0gdGhpcy51bm1hcnNoYWxsKFxuICAgICAgICBzaGFwZS52YWx1ZS5zaGFwZSxcbiAgICAgICAgbWFwRW50cnlbdmFsdWVOYW1lXVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iajtcbiAgfVxuXG4gIHByaXZhdGUgcGFyc2VUaW1lU3RhbXAoXG4gICAgc2hhcGU6IFRpbWVzdGFtcCxcbiAgICB4bWxPYmo6IGFueVxuICApOiBEYXRlIHwgdW5kZWZpbmVkIHwgbnVsbCB7XG4gICAgaWYgKCF4bWxPYmopIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGxldCBkYXRlID0gdG9EYXRlKHhtbE9iaik7XG4gICAgaWYgKGRhdGUudG9TdHJpbmcoKSA9PT0gXCJJbnZhbGlkIERhdGVcIikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGU7XG4gIH1cbn1cbiJdfQ==

/***/ }),

/***/ 79193:
/***/ ((__unused_webpack_module, exports) => {

/*
	JavaScript XML Library
	Plus a bunch of object utility functions
	
	Usage:
		var XML = require('pixl-xml');
		var myxmlstring = '<?xml version="1.0"?><Document>' + 
			'<Simple>Hello</Simple>' + 
			'<Node Key="Value">Content</Node>' + 
			'</Document>';
		
		var tree = XML.parse( myxmlstring, { preserveAttributes: true });
		console.log( tree );
		
		tree.Simple = "Hello2";
		tree.Node._Attribs.Key = "Value2";
		tree.Node._Data = "Content2";
		tree.New = "I added this";
		
		console.log( XML.stringify( tree, 'Document' ) );
	
	Copyright (c) 2004 - 2015 Joseph Huckaby
	Released under the MIT License
	This version is for Node.JS, converted in 2012.
*/

// var fs = require('fs');
// var util = require('util');

// var isArray = Array.isArray || util.isArray; // support for older Node.js
var isArray = Array.isArray;
var xml_header = '<?xml version="1.0"?>';
var sort_args = null;
var re_valid_tag_name = /^\w[\w\-\:\.]*$/;

var XML = (exports.XML = exports.Parser = function XML(args, opts) {
  // class constructor for XML parser class
  // pass in args hash or text to parse
  if (!args) args = "";
  if (isa_hash(args)) {
    for (var key in args) this[key] = args[key];
  } else this.text = args || "";

  // options may be 2nd argument as well
  if (opts) {
    for (var key in opts) this[key] = opts[key];
  }

  this.tree = {};
  this.errors = [];
  this.piNodeList = [];
  this.dtdNodeList = [];
  this.documentNodeName = "";

  if (this.lowerCase) {
    this.attribsKey = this.attribsKey.toLowerCase();
    this.dataKey = this.dataKey.toLowerCase();
  }

  this.patTag.lastIndex = 0;
  if (this.text) this.parse();
});

XML.prototype.preserveDocumentNode = false;
XML.prototype.preserveAttributes = false;
XML.prototype.preserveWhitespace = false;
XML.prototype.lowerCase = false;
XML.prototype.forceArrays = false;

XML.prototype.patTag = /([^<]*?)<([^>]+)>/g;
XML.prototype.patSpecialTag = /^\s*([\!\?])/;
XML.prototype.patPITag = /^\s*\?/;
XML.prototype.patCommentTag = /^\s*\!--/;
XML.prototype.patDTDTag = /^\s*\!DOCTYPE/;
XML.prototype.patCDATATag = /^\s*\!\s*\[\s*CDATA/;
XML.prototype.patStandardTag = /^\s*(\/?)([\w\-\:\.]+)\s*([\s\S]*)$/;
XML.prototype.patSelfClosing = /\/\s*$/;
XML.prototype.patAttrib = new RegExp(
  "([\\w\\-\\:\\.]+)\\s*=\\s*([\\\"\\'])([^\\2]*?)\\2",
  "g"
);
XML.prototype.patPINode = /^\s*\?\s*([\w\-\:]+)\s*(.*)$/;
XML.prototype.patEndComment = /--$/;
XML.prototype.patNextClose = /([^>]*?)>/g;
XML.prototype.patExternalDTDNode = new RegExp(
  '^\\s*\\!DOCTYPE\\s+([\\w\\-\\:]+)\\s+(SYSTEM|PUBLIC)\\s+\\"([^\\"]+)\\"'
);
XML.prototype.patInlineDTDNode = /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[/;
XML.prototype.patEndDTD = /\]$/;
XML.prototype.patDTDNode = /^\s*\!DOCTYPE\s+([\w\-\:]+)\s+\[(.*)\]/;
XML.prototype.patEndCDATA = /\]\]$/;
XML.prototype.patCDATANode = /^\s*\!\s*\[\s*CDATA\s*\[([^]*)\]\]/;

XML.prototype.attribsKey = "_Attribs";
XML.prototype.dataKey = "_Data";

XML.prototype.parse = function(branch, name) {
  // parse text into XML tree, recurse for nested nodes
  if (!branch) branch = this.tree;
  if (!name) name = null;
  var foundClosing = false;
  var matches = null;

  // match each tag, plus preceding text
  while ((matches = this.patTag.exec(this.text))) {
    var before = matches[1];
    var tag = matches[2];

    // text leading up to tag = content of parent node
    if (before.match(/\S/)) {
      if (typeof branch[this.dataKey] != "undefined")
        branch[this.dataKey] += " ";
      else branch[this.dataKey] = "";
      branch[this.dataKey] += !this.preserveWhitespace
        ? trim(decode_entities(before))
        : decode_entities(before);
    }

    // parse based on tag type
    if (tag.match(this.patSpecialTag)) {
      // special tag
      if (tag.match(this.patPITag)) tag = this.parsePINode(tag);
      else if (tag.match(this.patCommentTag)) tag = this.parseCommentNode(tag);
      else if (tag.match(this.patDTDTag)) tag = this.parseDTDNode(tag);
      else if (tag.match(this.patCDATATag)) {
        tag = this.parseCDATANode(tag);
        if (typeof branch[this.dataKey] != "undefined")
          branch[this.dataKey] += " ";
        else branch[this.dataKey] = "";
        branch[this.dataKey] += !this.preserveWhitespace
          ? trim(decode_entities(tag))
          : decode_entities(tag);
      } // cdata
      else {
        this.throwParseError("Malformed special tag", tag);
        break;
      } // error

      if (tag == null) break;
      continue;
    } // special tag
    else {
      // Tag is standard, so parse name and attributes (if any)
      var matches = tag.match(this.patStandardTag);
      if (!matches) {
        this.throwParseError("Malformed tag", tag);
        break;
      }

      var closing = matches[1];
      var nodeName = this.lowerCase ? matches[2].toLowerCase() : matches[2];
      var attribsRaw = matches[3];

      // If this is a closing tag, make sure it matches its opening tag
      if (closing) {
        if (nodeName == (name || "")) {
          foundClosing = 1;
          break;
        } else {
          this.throwParseError(
            "Mismatched closing tag (expected </" + name + ">)",
            tag
          );
          break;
        }
      } // closing tag
      else {
        // Not a closing tag, so parse attributes into hash.  If tag
        // is self-closing, no recursive parsing is needed.
        var selfClosing = !!attribsRaw.match(this.patSelfClosing);
        var leaf = {};
        var attribs = leaf;

        // preserve attributes means they go into a sub-hash named "_Attribs"
        // the XML composer honors this for restoring the tree back into XML
        if (this.preserveAttributes) {
          leaf[this.attribsKey] = {};
          attribs = leaf[this.attribsKey];
        }

        // parse attributes
        this.patAttrib.lastIndex = 0;
        while ((matches = this.patAttrib.exec(attribsRaw))) {
          var key = this.lowerCase ? matches[1].toLowerCase() : matches[1];
          attribs[key] = decode_entities(matches[3]);
        } // foreach attrib

        // if no attribs found, but we created the _Attribs subhash, clean it up now
        if (this.preserveAttributes && !num_keys(attribs)) {
          delete leaf[this.attribsKey];
        }

        // Recurse for nested nodes
        if (!selfClosing) {
          this.parse(leaf, nodeName);
          if (this.error()) break;
        }

        // Compress into simple node if text only
        var num_leaf_keys = num_keys(leaf);
        if (typeof leaf[this.dataKey] != "undefined" && num_leaf_keys == 1) {
          leaf = leaf[this.dataKey];
        } else if (!num_leaf_keys) {
          leaf = "";
        }

        // Add leaf to parent branch
        if (typeof branch[nodeName] != "undefined") {
          if (isa_array(branch[nodeName])) {
            branch[nodeName].push(leaf);
          } else {
            var temp = branch[nodeName];
            branch[nodeName] = [temp, leaf];
          }
        } else if (this.forceArrays && branch != this.tree) {
          branch[nodeName] = [leaf];
        } else {
          branch[nodeName] = leaf;
        }

        if (this.error() || branch == this.tree) break;
      } // not closing
    } // standard tag
  } // main reg exp

  // Make sure we found the closing tag
  if (name && !foundClosing) {
    this.throwParseError(
      "Missing closing tag (expected </" + name + ">)",
      name
    );
  }

  // If we are the master node, finish parsing and setup our doc node
  if (branch == this.tree) {
    if (typeof this.tree[this.dataKey] != "undefined")
      delete this.tree[this.dataKey];

    if (num_keys(this.tree) > 1) {
      this.throwParseError(
        "Only one top-level node is allowed in document",
        first_key(this.tree)
      );
      return;
    }

    this.documentNodeName = first_key(this.tree);
    if (this.documentNodeName && !this.preserveDocumentNode) {
      this.tree = this.tree[this.documentNodeName];
    }
  }
};

XML.prototype.throwParseError = function(key, tag) {
  // log error and locate current line number in source XML document
  var parsedSource = this.text.substring(0, this.patTag.lastIndex);
  var eolMatch = parsedSource.match(/\n/g);
  var lineNum = (eolMatch ? eolMatch.length : 0) + 1;
  lineNum -= tag.match(/\n/) ? tag.match(/\n/g).length : 0;

  this.errors.push({
    type: "Parse",
    key: key,
    text: "<" + tag + ">",
    line: lineNum
  });

  // Throw actual error (must wrap parse in try/catch)
  throw new Error(this.getLastError());
};

XML.prototype.error = function() {
  // return number of errors
  return this.errors.length;
};

XML.prototype.getError = function(error) {
  // get formatted error
  var text = "";
  if (!error) return "";

  text = (error.type || "General") + " Error";
  if (error.code) text += " " + error.code;
  text += ": " + error.key;

  if (error.line) text += " on line " + error.line;
  if (error.text) text += ": " + error.text;

  return text;
};

XML.prototype.getLastError = function() {
  // Get most recently thrown error in plain text format
  if (!this.error()) return "";
  return this.getError(this.errors[this.errors.length - 1]);
};

XML.prototype.parsePINode = function(tag) {
  // Parse Processor Instruction Node, e.g. <?xml version="1.0"?>
  if (!tag.match(this.patPINode)) {
    this.throwParseError("Malformed processor instruction", tag);
    return null;
  }

  this.piNodeList.push(tag);
  return tag;
};

XML.prototype.parseCommentNode = function(tag) {
  // Parse Comment Node, e.g. <!-- hello -->
  var matches = null;
  this.patNextClose.lastIndex = this.patTag.lastIndex;

  while (!tag.match(this.patEndComment)) {
    if ((matches = this.patNextClose.exec(this.text))) {
      tag += ">" + matches[1];
    } else {
      this.throwParseError("Unclosed comment tag", tag);
      return null;
    }
  }

  this.patTag.lastIndex = this.patNextClose.lastIndex;
  return tag;
};

XML.prototype.parseDTDNode = function(tag) {
  // Parse Document Type Descriptor Node, e.g. <!DOCTYPE ... >
  var matches = null;

  if (tag.match(this.patExternalDTDNode)) {
    // tag is external, and thus self-closing
    this.dtdNodeList.push(tag);
  } else if (tag.match(this.patInlineDTDNode)) {
    // Tag is inline, so check for nested nodes.
    this.patNextClose.lastIndex = this.patTag.lastIndex;

    while (!tag.match(this.patEndDTD)) {
      if ((matches = this.patNextClose.exec(this.text))) {
        tag += ">" + matches[1];
      } else {
        this.throwParseError("Unclosed DTD tag", tag);
        return null;
      }
    }

    this.patTag.lastIndex = this.patNextClose.lastIndex;

    // Make sure complete tag is well-formed, and push onto DTD stack.
    if (tag.match(this.patDTDNode)) {
      this.dtdNodeList.push(tag);
    } else {
      this.throwParseError("Malformed DTD tag", tag);
      return null;
    }
  } else {
    this.throwParseError("Malformed DTD tag", tag);
    return null;
  }

  return tag;
};

XML.prototype.parseCDATANode = function(tag) {
  // Parse CDATA Node, e.g. <![CDATA[Brooks & Shields]]>
  var matches = null;
  this.patNextClose.lastIndex = this.patTag.lastIndex;

  while (!tag.match(this.patEndCDATA)) {
    if ((matches = this.patNextClose.exec(this.text))) {
      tag += ">" + matches[1];
    } else {
      this.throwParseError("Unclosed CDATA tag", tag);
      return null;
    }
  }

  this.patTag.lastIndex = this.patNextClose.lastIndex;

  if ((matches = tag.match(this.patCDATANode))) {
    return matches[1];
  } else {
    this.throwParseError("Malformed CDATA tag", tag);
    return null;
  }
};

XML.prototype.getTree = function() {
  // get reference to parsed XML tree
  return this.tree;
};

XML.prototype.compose = function(indent_string, eol) {
  // compose tree back into XML
  if (typeof eol == "undefined") eol = "\n";
  var tree = this.tree;
  if (this.preserveDocumentNode) tree = tree[this.documentNodeName];

  var raw = compose_xml(tree, this.documentNodeName, 0, indent_string, eol);
  var body = raw.replace(/^\s*\<\?.+?\?\>\s*/, "");
  var xml = "";

  if (this.piNodeList.length) {
    for (var idx = 0, len = this.piNodeList.length; idx < len; idx++) {
      xml += "<" + this.piNodeList[idx] + ">" + eol;
    }
  } else {
    xml += xml_header + eol;
  }

  if (this.dtdNodeList.length) {
    for (var idx = 0, len = this.dtdNodeList.length; idx < len; idx++) {
      xml += "<" + this.dtdNodeList[idx] + ">" + eol;
    }
  }

  xml += body;
  return xml;
};

//
// Static Utility Functions:
//

var parse_xml = (exports.parse = function parse_xml(text, opts) {
  // turn text into XML tree quickly
  if (!opts) opts = {};
  opts.text = text;
  var parser = new XML(opts);
  return parser.error() ? parser.getLastError() : parser.getTree();
});

var trim = (exports.trim = function trim(text) {
  // strip whitespace from beginning and end of string
  if (text == null) return "";

  if (text && text.replace) {
    text = text.replace(/^\s+/, "");
    text = text.replace(/\s+$/, "");
  }

  return text;
});

var encode_entities = (exports.encodeEntities = function encode_entities(text) {
  // Simple entitize exports.for = function for composing XML
  if (text == null) return "";

  if (text && text.replace) {
    text = text.replace(/\&/g, "&amp;"); // MUST BE FIRST
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
  }

  return text;
});

var encode_attrib_entities = (exports.encodeAttribEntities = function encode_attrib_entities(
  text
) {
  // Simple entitize exports.for = function for composing XML attributes
  if (text == null) return "";

  if (text && text.replace) {
    text = text.replace(/\&/g, "&amp;"); // MUST BE FIRST
    text = text.replace(/</g, "&lt;");
    text = text.replace(/>/g, "&gt;");
    text = text.replace(/\"/g, "&quot;");
    text = text.replace(/\'/g, "&apos;");
  }

  return text;
});

var decode_entities = (exports.decodeEntities = function decode_entities(text) {
  // Decode XML entities into raw ASCII
  if (text == null) return "";

  if (text && text.replace && text.match(/\&/)) {
    text = text.replace(/\&lt\;/g, "<");
    text = text.replace(/\&gt\;/g, ">");
    text = text.replace(/\&quot\;/g, '"');
    text = text.replace(/\&apos\;/g, "'");
    text = text.replace(/\&amp\;/g, "&"); // MUST BE LAST
  }

  return text;
});

var compose_xml = (exports.stringify = function compose_xml(
  node,
  name,
  indent,
  indent_string,
  eol,
  sort
) {
  // Compose node into XML including attributes
  // Recurse for child nodes
  if (typeof indent_string == "undefined") indent_string = "\t";
  if (typeof eol == "undefined") eol = "\n";
  if (typeof sort == "undefined") sort = true;
  var xml = "";

  // If this is the root node, set the indent to 0
  // and setup the XML header (PI node)
  if (!indent) {
    indent = 0;
    xml = xml_header + eol;

    if (!name) {
      // no name provided, assume content is wrapped in it
      name = first_key(node);
      node = node[name];
    }
  }

  // Setup the indent text
  var indent_text = "";
  for (var k = 0; k < indent; k++) indent_text += indent_string;

  if (typeof node == "object" && node != null) {
    // node is object -- now see if it is an array or hash
    if (!node.length) {
      // what about zero-length array?
      // node is hash
      xml += indent_text + "<" + name;

      var num_keys = 0;
      var has_attribs = 0;
      for (var key in node) num_keys++; // there must be a better way...

      if (node["_Attribs"]) {
        has_attribs = 1;
        var sorted_keys = sort
          ? hash_keys_to_array(node["_Attribs"]).sort()
          : hash_keys_to_array(node["_Attribs"]);
        for (var idx = 0, len = sorted_keys.length; idx < len; idx++) {
          var key = sorted_keys[idx];
          xml +=
            " " +
            key +
            '="' +
            encode_attrib_entities(node["_Attribs"][key]) +
            '"';
        }
      } // has attribs

      if (num_keys > has_attribs) {
        // has child elements
        xml += ">";

        if (node["_Data"]) {
          // simple text child node
          xml += encode_entities(node["_Data"]) + "</" + name + ">" + eol;
        } // just text
        else {
          xml += eol;

          var sorted_keys = sort
            ? hash_keys_to_array(node).sort()
            : hash_keys_to_array(node);
          for (var idx = 0, len = sorted_keys.length; idx < len; idx++) {
            var key = sorted_keys[idx];
            if (key != "_Attribs" && key.match(re_valid_tag_name)) {
              // recurse for node, with incremented indent value
              xml += compose_xml(
                node[key],
                key,
                indent + 1,
                indent_string,
                eol,
                sort
              );
            } // not _Attribs key
          } // foreach key

          xml += indent_text + "</" + name + ">" + eol;
        } // real children
      } else {
        // no child elements, so self-close
        xml += "/>" + eol;
      }
    } // standard node
    else {
      // node is array
      for (var idx = 0; idx < node.length; idx++) {
        // recurse for node in array with same indent
        xml += compose_xml(node[idx], name, indent, indent_string, eol, sort);
      }
    } // array of nodes
  } // complex node
  else {
    // node is simple string
    xml +=
      indent_text +
      "<" +
      name +
      ">" +
      encode_entities(node) +
      "</" +
      name +
      ">" +
      eol;
  } // simple text node

  return xml;
});

var always_array = (exports.alwaysArray = function always_array(obj, key) {
  // if object is not array, return array containing object
  // if key is passed, work like XMLalwaysarray() instead
  if (key) {
    if (typeof obj[key] != "object" || typeof obj[key].length == "undefined") {
      var temp = obj[key];
      delete obj[key];
      obj[key] = new Array();
      obj[key][0] = temp;
    }
    return null;
  } else {
    if (typeof obj != "object" || typeof obj.length == "undefined") {
      return [obj];
    } else return obj;
  }
});

var hash_keys_to_array = (exports.hashKeysToArray = function hash_keys_to_array(
  hash
) {
  // convert hash keys to array (discard values)
  var array = [];
  for (var key in hash) array.push(key);
  return array;
});

var isa_array = (exports.isaArray = function isa_array(arg) {
  // determine if arg is an array or is array-like
  return isArray(arg);
});

var isa_hash = (exports.isaHash = function isa_hash(arg) {
  // determine if arg is a hash
  return !!arg && typeof arg == "object" && !isa_array(arg);
});

var first_key = (exports.firstKey = function first_key(hash) {
  // return first key from hash (unordered)
  for (var key in hash) return key;
  return null; // no keys in hash
});

var num_keys = (exports.numKeys = function num_keys(hash) {
  // count the number of keys in a hash
  var count = 0;
  for (var a in hash) count++;
  return count;
});


/***/ }),

/***/ 60622:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var escape_attribute_1 = __webpack_require__(91468);
/**
 * Represents an XML node.
 */
var XmlNode = /** @class */ (function () {
    function XmlNode(name, children) {
        if (children === void 0) { children = []; }
        this.name = name;
        this.children = children;
        this.attributes = {};
    }
    XmlNode.prototype.addAttribute = function (name, value) {
        this.attributes[name] = value;
        return this;
    };
    XmlNode.prototype.addChildNode = function (child) {
        this.children.push(child);
        return this;
    };
    XmlNode.prototype.removeAttribute = function (name) {
        delete this.attributes[name];
        return this;
    };
    XmlNode.prototype.toString = function () {
        var hasChildren = Boolean(this.children.length);
        var xmlText = "<" + this.name;
        // add attributes
        var attributes = this.attributes;
        for (var _i = 0, _a = Object.keys(attributes); _i < _a.length; _i++) {
            var attributeName = _a[_i];
            var attribute = attributes[attributeName];
            if (typeof attribute !== "undefined" && attribute !== null) {
                xmlText += " " + attributeName + "=\"" + escape_attribute_1.escapeAttribute("" + attribute) + "\"";
            }
        }
        return (xmlText += !hasChildren
            ? "/>"
            : ">" + this.children.map(function (c) { return c.toString(); }).join("") + "</" + this.name + ">");
    };
    return XmlNode;
}());
exports.XmlNode = XmlNode;
//# sourceMappingURL=XmlNode.js.map

/***/ }),

/***/ 85265:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var escape_element_1 = __webpack_require__(26044);
/**
 * Represents an XML text value.
 */
var XmlText = /** @class */ (function () {
    function XmlText(value) {
        this.value = value;
    }
    XmlText.prototype.toString = function () {
        return escape_element_1.escapeElement("" + this.value);
    };
    return XmlText;
}());
exports.XmlText = XmlText;
//# sourceMappingURL=XmlText.js.map

/***/ }),

/***/ 91468:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Escapes characters that can not be in an XML attribute.
 */
function escapeAttribute(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
exports.escapeAttribute = escapeAttribute;
//# sourceMappingURL=escape-attribute.js.map

/***/ }),

/***/ 26044:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
/**
 * Escapes characters that can not be in an XML element.
 */
function escapeElement(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
exports.escapeElement = escapeElement;
//# sourceMappingURL=escape-element.js.map

/***/ }),

/***/ 9776:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
var tslib_1 = __webpack_require__(75636);
tslib_1.__exportStar(__webpack_require__(60622), exports);
tslib_1.__exportStar(__webpack_require__(85265), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 9417:
/***/ ((module) => {

"use strict";

module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}


/***/ }),

/***/ 33717:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var concatMap = __webpack_require__(86891);
var balanced = __webpack_require__(9417);

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}



/***/ }),

/***/ 86891:
/***/ ((module) => {

module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),

/***/ 83973:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = { sep: '/' }
try {
  path = __webpack_require__(85622)
} catch (er) {}

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = __webpack_require__(33717)

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  a = a || {}
  b = b || {}
  var t = {}
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return minimatch

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig.minimatch(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  if (!def || !Object.keys(def).length) return Minimatch
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  // "" only matches ""
  if (pattern.trim() === '') return p === ''

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  if (typeof pattern !== 'string') {
    throw new TypeError('glob pattern string required')
  }

  if (!options) options = {}
  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  // don't do it more than once.
  if (this._made) return

  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = console.error

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  if (typeof pattern === 'undefined') {
    throw new TypeError('undefined pattern')
  }

  if (options.nobrace ||
    !pattern.match(/\{.*\}/)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  if (pattern.length > 1024 * 64) {
    throw new TypeError('pattern is too long')
  }

  var options = this.options

  // shortcuts
  if (!options.noglobstar && pattern === '**') return GLOBSTAR
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      case '/':
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        if (inClass) {
          // split where the last [ was, make sure we don't have
          // an invalid re. if so, re-walk the contents of the
          // would-be class to re-translate any characters that
          // were passed through as-is
          // TODO: It would probably be faster to determine this
          // without a try/catch and a new RegExp, but it's tricky
          // to do safely.  For now, this is safe and works.
          var cs = pattern.substring(classStart + 1, i)
          try {
            RegExp('[' + cs + ']')
          } catch (er) {
            // not a valid class!
            var sp = this.parse(cs, SUBPARSE)
            re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
            hasMagic = hasMagic || sp[1]
            inClass = false
            continue
          }
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '.':
    case '[':
    case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = match
function match (f, partial) {
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      if (options.nocase) {
        hit = f.toLowerCase() === p.toLowerCase()
      } else {
        hit = f === p
      }
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    var emptyFileEnd = (fi === fl - 1) && (file[fi] === '')
    return emptyFileEnd
  }

  // should be unreachable.
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}


/***/ }),

/***/ 66186:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const optsArg = __webpack_require__(42853)
const pathArg = __webpack_require__(12930)

const {mkdirpNative, mkdirpNativeSync} = __webpack_require__(4983)
const {mkdirpManual, mkdirpManualSync} = __webpack_require__(40356)
const {useNative, useNativeSync} = __webpack_require__(54518)


const mkdirp = (path, opts) => {
  path = pathArg(path)
  opts = optsArg(opts)
  return useNative(opts)
    ? mkdirpNative(path, opts)
    : mkdirpManual(path, opts)
}

const mkdirpSync = (path, opts) => {
  path = pathArg(path)
  opts = optsArg(opts)
  return useNativeSync(opts)
    ? mkdirpNativeSync(path, opts)
    : mkdirpManualSync(path, opts)
}

mkdirp.sync = mkdirpSync
mkdirp.native = (path, opts) => mkdirpNative(pathArg(path), optsArg(opts))
mkdirp.manual = (path, opts) => mkdirpManual(pathArg(path), optsArg(opts))
mkdirp.nativeSync = (path, opts) => mkdirpNativeSync(pathArg(path), optsArg(opts))
mkdirp.manualSync = (path, opts) => mkdirpManualSync(pathArg(path), optsArg(opts))

module.exports = mkdirp


/***/ }),

/***/ 44992:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {dirname} = __webpack_require__(85622)

const findMade = (opts, parent, path = undefined) => {
  // we never want the 'made' return value to be a root directory
  if (path === parent)
    return Promise.resolve()

  return opts.statAsync(parent).then(
    st => st.isDirectory() ? path : undefined, // will fail later
    er => er.code === 'ENOENT'
      ? findMade(opts, dirname(parent), parent)
      : undefined
  )
}

const findMadeSync = (opts, parent, path = undefined) => {
  if (path === parent)
    return undefined

  try {
    return opts.statSync(parent).isDirectory() ? path : undefined
  } catch (er) {
    return er.code === 'ENOENT'
      ? findMadeSync(opts, dirname(parent), parent)
      : undefined
  }
}

module.exports = {findMade, findMadeSync}


/***/ }),

/***/ 40356:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {dirname} = __webpack_require__(85622)

const mkdirpManual = (path, opts, made) => {
  opts.recursive = false
  const parent = dirname(path)
  if (parent === path) {
    return opts.mkdirAsync(path, opts).catch(er => {
      // swallowed by recursive implementation on posix systems
      // any other error is a failure
      if (er.code !== 'EISDIR')
        throw er
    })
  }

  return opts.mkdirAsync(path, opts).then(() => made || path, er => {
    if (er.code === 'ENOENT')
      return mkdirpManual(parent, opts)
        .then(made => mkdirpManual(path, opts, made))
    if (er.code !== 'EEXIST' && er.code !== 'EROFS')
      throw er
    return opts.statAsync(path).then(st => {
      if (st.isDirectory())
        return made
      else
        throw er
    }, () => { throw er })
  })
}

const mkdirpManualSync = (path, opts, made) => {
  const parent = dirname(path)
  opts.recursive = false

  if (parent === path) {
    try {
      return opts.mkdirSync(path, opts)
    } catch (er) {
      // swallowed by recursive implementation on posix systems
      // any other error is a failure
      if (er.code !== 'EISDIR')
        throw er
      else
        return
    }
  }

  try {
    opts.mkdirSync(path, opts)
    return made || path
  } catch (er) {
    if (er.code === 'ENOENT')
      return mkdirpManualSync(path, opts, mkdirpManualSync(parent, opts, made))
    if (er.code !== 'EEXIST' && er.code !== 'EROFS')
      throw er
    try {
      if (!opts.statSync(path).isDirectory())
        throw er
    } catch (_) {
      throw er
    }
  }
}

module.exports = {mkdirpManual, mkdirpManualSync}


/***/ }),

/***/ 4983:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {dirname} = __webpack_require__(85622)
const {findMade, findMadeSync} = __webpack_require__(44992)
const {mkdirpManual, mkdirpManualSync} = __webpack_require__(40356)

const mkdirpNative = (path, opts) => {
  opts.recursive = true
  const parent = dirname(path)
  if (parent === path)
    return opts.mkdirAsync(path, opts)

  return findMade(opts, path).then(made =>
    opts.mkdirAsync(path, opts).then(() => made)
    .catch(er => {
      if (er.code === 'ENOENT')
        return mkdirpManual(path, opts)
      else
        throw er
    }))
}

const mkdirpNativeSync = (path, opts) => {
  opts.recursive = true
  const parent = dirname(path)
  if (parent === path)
    return opts.mkdirSync(path, opts)

  const made = findMadeSync(opts, path)
  try {
    opts.mkdirSync(path, opts)
    return made
  } catch (er) {
    if (er.code === 'ENOENT')
      return mkdirpManualSync(path, opts)
    else
      throw er
  }
}

module.exports = {mkdirpNative, mkdirpNativeSync}


/***/ }),

/***/ 42853:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { promisify } = __webpack_require__(31669)
const fs = __webpack_require__(35747)
const optsArg = opts => {
  if (!opts)
    opts = { mode: 0o777, fs }
  else if (typeof opts === 'object')
    opts = { mode: 0o777, fs, ...opts }
  else if (typeof opts === 'number')
    opts = { mode: opts, fs }
  else if (typeof opts === 'string')
    opts = { mode: parseInt(opts, 8), fs }
  else
    throw new TypeError('invalid options argument')

  opts.mkdir = opts.mkdir || opts.fs.mkdir || fs.mkdir
  opts.mkdirAsync = promisify(opts.mkdir)
  opts.stat = opts.stat || opts.fs.stat || fs.stat
  opts.statAsync = promisify(opts.stat)
  opts.statSync = opts.statSync || opts.fs.statSync || fs.statSync
  opts.mkdirSync = opts.mkdirSync || opts.fs.mkdirSync || fs.mkdirSync
  return opts
}
module.exports = optsArg


/***/ }),

/***/ 12930:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const platform = process.env.__TESTING_MKDIRP_PLATFORM__ || process.platform
const { resolve, parse } = __webpack_require__(85622)
const pathArg = path => {
  if (/\0/.test(path)) {
    // simulate same failure that node raises
    throw Object.assign(
      new TypeError('path must be a string without null bytes'),
      {
        path,
        code: 'ERR_INVALID_ARG_VALUE',
      }
    )
  }

  path = resolve(path)
  if (platform === 'win32') {
    const badWinChars = /[*|"<>?:]/
    const {root} = parse(path)
    if (badWinChars.test(path.substr(root.length))) {
      throw Object.assign(new Error('Illegal characters in path.'), {
        path,
        code: 'EINVAL',
      })
    }
  }

  return path
}
module.exports = pathArg


/***/ }),

/***/ 54518:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const fs = __webpack_require__(35747)

const version = process.env.__TESTING_MKDIRP_NODE_VERSION__ || process.version
const versArr = version.replace(/^v/, '').split('.')
const hasNative = +versArr[0] > 10 || +versArr[0] === 10 && +versArr[1] >= 12

const useNative = !hasNative ? () => false : opts => opts.mkdir === fs.mkdir
const useNativeSync = !hasNative ? () => false : opts => opts.mkdirSync === fs.mkdirSync

module.exports = {useNative, useNativeSync}


/***/ }),

/***/ 75636:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__extends": () => /* binding */ __extends,
/* harmony export */   "__assign": () => /* binding */ __assign,
/* harmony export */   "__rest": () => /* binding */ __rest,
/* harmony export */   "__decorate": () => /* binding */ __decorate,
/* harmony export */   "__param": () => /* binding */ __param,
/* harmony export */   "__metadata": () => /* binding */ __metadata,
/* harmony export */   "__awaiter": () => /* binding */ __awaiter,
/* harmony export */   "__generator": () => /* binding */ __generator,
/* harmony export */   "__createBinding": () => /* binding */ __createBinding,
/* harmony export */   "__exportStar": () => /* binding */ __exportStar,
/* harmony export */   "__values": () => /* binding */ __values,
/* harmony export */   "__read": () => /* binding */ __read,
/* harmony export */   "__spread": () => /* binding */ __spread,
/* harmony export */   "__spreadArrays": () => /* binding */ __spreadArrays,
/* harmony export */   "__await": () => /* binding */ __await,
/* harmony export */   "__asyncGenerator": () => /* binding */ __asyncGenerator,
/* harmony export */   "__asyncDelegator": () => /* binding */ __asyncDelegator,
/* harmony export */   "__asyncValues": () => /* binding */ __asyncValues,
/* harmony export */   "__makeTemplateObject": () => /* binding */ __makeTemplateObject,
/* harmony export */   "__importStar": () => /* binding */ __importStar,
/* harmony export */   "__importDefault": () => /* binding */ __importDefault,
/* harmony export */   "__classPrivateFieldGet": () => /* binding */ __classPrivateFieldGet,
/* harmony export */   "__classPrivateFieldSet": () => /* binding */ __classPrivateFieldSet
/* harmony export */ });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __createBinding(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}

function __exportStar(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
}

function __classPrivateFieldSet(receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
}


/***/ }),

/***/ 42357:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 64293:
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ 63129:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 76417:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 35747:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 98605:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 57211:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 12087:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 85622:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 61765:
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ 92413:
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ 78835:
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ 31669:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	__webpack_require__.ab = __dirname + "/";/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(94822);
/******/ })()
;
//# sourceMappingURL=index.js.map