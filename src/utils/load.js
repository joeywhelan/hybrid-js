import fs from 'node:fs';
import { Stream } from 'node:stream';
import JSONStream from 'JSONStream';
import { parse } from 'csv-parse';
import { createGunzip } from 'node:zlib';


async function load() {
    const queryInStream = fs.createReadStream('queries.tsv')
        .pipe(parse({delimiter: '\t'}))
        .pipe(new Stream.PassThrough({objectMode: true}));

    let queries = {}
    for await (const row of queryInStream) {
        queries[row[0]] = row[1];
    }
  
    const top100Stream = fs.createReadStream('passv2_dev2_top100.txt')
        .pipe(parse({delimiter: ' '}))
        .pipe(new Stream.PassThrough({objectMode: true}));

    let dataSet = {}
    for await (const row of top100Stream) {
        if (Object.prototype.hasOwnProperty.call(queries, row[0])) {
        //if (queries.hasOwnProperty(row[0])) {
            const qid = row[0];
            const query = queries[qid];
            if (!Object.prototype.hasOwnProperty.call(dataSet, qid)) {
            //if (! dataSet.hasOwnProperty(qid)) {
                dataSet[qid] = {}
                dataSet[qid]['query'] = query;
                dataSet[qid]['pidObjs'] = [];
            }
            if (dataSet[qid]['pidObjs'].length < 10) { 
                dataSet[qid]['pidObjs'].push({[row[2]]:parseInt(row[3])});
            }
        }
    }
   
    const passageOutStream = fs.createWriteStream('../data/passages.jsonl', {flags: 'a'});
    const queryOutStream = fs.createWriteStream('../data/queries.jsonl', {flags: 'a'})
    for (const qid in dataSet) {
        let query = dataSet[qid]['query'];
        queryOutStream.write(JSON.stringify({'qid': qid, 'query': query}) +'\n');
        for (const pidObj of dataSet[qid]['pidObjs']) {
            let pid = Object.keys(pidObj)[0]
            let filename = pid.substring(0,18) + '.gz';
            let rank = pidObj[pid] 

            const jsonInStr = fs.createReadStream(`msmarco_v2_passage/${filename}`)
                .pipe(createGunzip())
                .pipe(JSONStream.parse())
                .pipe(new Stream.PassThrough({objectMode: true}))

            for await (const doc of jsonInStr) {
                if (doc['pid'] == pid) {
                    let obj = {
                        'qid': qid, 
                        'pid': pid.split('msmarco_passage_')[1], 
                        'rank': rank,
                        'text': doc['passage']
                    };
                    passageOutStream.write(JSON.stringify(obj)+'\n');
                    break;
                 }
            } 
        }      
    }
    passageOutStream.end(); 
    queryOutStream.end();
}

(async () => {
    await load();
})();