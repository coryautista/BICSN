"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logManager = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var LogManager = /** @class */ (function () {
    function LogManager(logDir) {
        this.logDir = logDir || path_1.default.join(__dirname, '../../logs');
    }
    LogManager.prototype.getLogStats = function () {
        var _this = this;
        var stats = {
            totalFiles: 0,
            totalSize: 0,
            oldestFile: null,
            newestFile: null,
            files: []
        };
        try {
            if (!fs_1.default.existsSync(this.logDir)) {
                return stats;
            }
            var files = fs_1.default.readdirSync(this.logDir)
                .filter(function (file) { return file.endsWith('.log'); })
                .map(function (file) {
                var filePath = path_1.default.join(_this.logDir, file);
                var fileStats = fs_1.default.statSync(filePath);
                return {
                    name: file,
                    size: fileStats.size,
                    created: fileStats.birthtime,
                    modified: fileStats.mtime
                };
            })
                .sort(function (a, b) { return a.created.getTime() - b.created.getTime(); });
            stats.totalFiles = files.length;
            stats.totalSize = files.reduce(function (sum, file) { return sum + file.size; }, 0);
            stats.files = files;
            if (files.length > 0) {
                stats.oldestFile = files[0].name;
                stats.newestFile = files[files.length - 1].name;
            }
        }
        catch (error) {
            console.error('Error getting log stats:', error);
        }
        return stats;
    };
    LogManager.prototype.cleanupOldLogs = function (maxAgeDays, maxFiles) {
        var _this = this;
        if (maxAgeDays === void 0) { maxAgeDays = 30; }
        if (maxFiles === void 0) { maxFiles = 50; }
        var deletedFiles = [];
        var totalDeleted = 0;
        try {
            if (!fs_1.default.existsSync(this.logDir)) {
                return { deletedFiles: deletedFiles, totalDeleted: totalDeleted };
            }
            var now_1 = new Date();
            var maxAgeMs_1 = maxAgeDays * 24 * 60 * 60 * 1000;
            var files = fs_1.default.readdirSync(this.logDir)
                .filter(function (file) { return file.endsWith('.log'); })
                .map(function (file) {
                var filePath = path_1.default.join(_this.logDir, file);
                var fileStats = fs_1.default.statSync(filePath);
                return {
                    name: file,
                    path: filePath,
                    created: fileStats.birthtime,
                    modified: fileStats.mtime,
                    size: fileStats.size
                };
            })
                .sort(function (a, b) { return a.created.getTime() - b.created.getTime(); }); // Oldest first
            // Delete files older than maxAgeDays
            var oldFiles = files.filter(function (file) { return (now_1.getTime() - file.created.getTime()) > maxAgeMs_1; });
            for (var _i = 0, oldFiles_1 = oldFiles; _i < oldFiles_1.length; _i++) {
                var file = oldFiles_1[_i];
                try {
                    fs_1.default.unlinkSync(file.path);
                    deletedFiles.push(file.name);
                    totalDeleted++;
                }
                catch (error) {
                    console.error("Error deleting old log file ".concat(file.name, ":"), error);
                }
            }
            // If still too many files, delete oldest ones
            if (files.length - totalDeleted > maxFiles) {
                var remainingFiles = files.slice(totalDeleted); // Skip already deleted files
                var filesToDelete = remainingFiles.slice(0, remainingFiles.length - maxFiles);
                for (var _a = 0, filesToDelete_1 = filesToDelete; _a < filesToDelete_1.length; _a++) {
                    var file = filesToDelete_1[_a];
                    try {
                        fs_1.default.unlinkSync(file.path);
                        deletedFiles.push(file.name);
                        totalDeleted++;
                    }
                    catch (error) {
                        console.error("Error deleting excess log file ".concat(file.name, ":"), error);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error during log cleanup:', error);
        }
        return { deletedFiles: deletedFiles, totalDeleted: totalDeleted };
    };
    LogManager.prototype.archiveLogs = function (archiveDir) {
        var archivedFiles = [];
        var totalArchived = 0;
        try {
            var targetDir = archiveDir || path_1.default.join(this.logDir, 'archive');
            if (!fs_1.default.existsSync(targetDir)) {
                fs_1.default.mkdirSync(targetDir, { recursive: true });
            }
            if (!fs_1.default.existsSync(this.logDir)) {
                return { archivedFiles: archivedFiles, totalArchived: totalArchived };
            }
            var files = fs_1.default.readdirSync(this.logDir)
                .filter(function (file) { return file.endsWith('.log') && !file.includes('archive'); });
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var file = files_1[_i];
                var sourcePath = path_1.default.join(this.logDir, file);
                var targetPath = path_1.default.join(targetDir, file);
                try {
                    fs_1.default.renameSync(sourcePath, targetPath);
                    archivedFiles.push(file);
                    totalArchived++;
                }
                catch (error) {
                    console.error("Error archiving log file ".concat(file, ":"), error);
                }
            }
        }
        catch (error) {
            console.error('Error during log archiving:', error);
        }
        return { archivedFiles: archivedFiles, totalArchived: totalArchived };
    };
    LogManager.prototype.searchLogs = function (searchTerm, maxResults) {
        if (maxResults === void 0) { maxResults = 100; }
        var results = [];
        try {
            if (!fs_1.default.existsSync(this.logDir)) {
                return results;
            }
            var files = fs_1.default.readdirSync(this.logDir)
                .filter(function (file) { return file.endsWith('.log'); })
                .sort()
                .reverse(); // Newest files first
            for (var _i = 0, files_2 = files; _i < files_2.length; _i++) {
                var file = files_2[_i];
                if (results.length >= maxResults)
                    break;
                var filePath = path_1.default.join(this.logDir, file);
                try {
                    var content = fs_1.default.readFileSync(filePath, 'utf-8');
                    var lines = content.split('\n');
                    for (var i = 0; i < lines.length; i++) {
                        var line = lines[i].trim();
                        if (!line)
                            continue;
                        if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
                            try {
                                var logEntry = JSON.parse(line);
                                results.push({
                                    file: file,
                                    line: i + 1,
                                    content: line,
                                    timestamp: logEntry.timestamp || 'unknown'
                                });
                                if (results.length >= maxResults)
                                    break;
                            }
                            catch (_a) {
                                // If not valid JSON, still include it
                                results.push({
                                    file: file,
                                    line: i + 1,
                                    content: line,
                                    timestamp: 'unknown'
                                });
                            }
                        }
                    }
                }
                catch (error) {
                    console.error("Error reading log file ".concat(file, ":"), error);
                }
            }
        }
        catch (error) {
            console.error('Error searching logs:', error);
        }
        return results;
    };
    LogManager.prototype.getLogContent = function (fileName, lines) {
        if (lines === void 0) { lines = 100; }
        try {
            var filePath = path_1.default.join(this.logDir, fileName);
            if (!fs_1.default.existsSync(filePath)) {
                return { content: '', totalLines: 0, hasMore: false };
            }
            var content = fs_1.default.readFileSync(filePath, 'utf-8');
            var allLines = content.split('\n');
            var totalLines = allLines.length;
            var requestedLines = allLines.slice(-lines); // Get last N lines
            var resultContent = requestedLines.join('\n');
            return {
                content: resultContent,
                totalLines: totalLines,
                hasMore: totalLines > lines
            };
        }
        catch (error) {
            console.error("Error reading log file ".concat(fileName, ":"), error);
            return { content: '', totalLines: 0, hasMore: false };
        }
    };
    return LogManager;
}());
// Export singleton instance
exports.logManager = new LogManager();
exports.default = exports.logManager;
