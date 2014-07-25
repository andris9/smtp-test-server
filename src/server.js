'use strict';

var simplesmtp = require('simplesmtp');
var crypto = require('crypto');
var Transform = require('stream').Transform;
var util = require('util');

module.exports = function() {
    var server = simplesmtp.createServer({
        SMTPBanner: 'Hash Test Server',
        ignoreTLS: true
    });

    server.on("startData", function(connection) {
        connection.hash = crypto.createHash('md5');
        connection.bytes = 0;
        connection.unescape = new DataStream();
        connection.unescape.on('data', function(chunk) {
            connection.hash.update(chunk);
            connection.bytes += chunk.length;
        });
    });

    server.on("data", function(connection, chunk) {
        connection.unescape.write(chunk);
    });

    server.on("dataReady", function(connection, done) {
        connection.unescape.end();
        var hash = connection.hash.digest('hex');
        done(null, util.format('%s (%s bytes)', hash, connection.bytes));
        console.log(util.format('%s (%s bytes)', hash, connection.bytes));
    });

    return server;
};

/**
 * Removes first dot on a line
 *
 * @param {Object} options Stream options
 */
function DataStream(options) {
    // init Transform
    this.options = options || {};
    this._curLine = '';

    this.lastByte = false;

    Transform.call(this, this.options);
}
util.inherits(DataStream, Transform);

/**
 * Unescapes dots
 */
DataStream.prototype._transform = function(chunk, encoding, done) {
    var chunks = [];
    var chunklen = 0;
    var buf;
    var lastPos = 0;

    if (encoding !== 'buffer') {
        chunk = new Buffer(chunk, encoding);
    }

    if (!chunk.length) {
        return done();
    }

    for (var i = 0, len = chunk.length; i < len; i++) {
        if (chunk[i] === 0x2e && (i && chunk[i - 1] || (this.lastByte || 0x0a)) === 0x0a) {
            if (i && i !== lastPos) {
                buf = chunk.slice(lastPos, i);
                chunks.push(buf);
                chunklen += buf.length;
            }
            lastPos = i + 1;
        }
    }

    if (lastPos) {
        buf = chunk.slice(lastPos);
        chunks.push(buf);
        chunklen += buf.length;
        this.push(Buffer.concat(chunks, chunklen));
    } else {
        this.push(chunk);
    }

    this.lastByte = chunk[chunk.length - 1];
    done();
};