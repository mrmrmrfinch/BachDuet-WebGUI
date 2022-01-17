importScripts("/tf.min.js")

const CHECKPOINT_BASE_URL = "/checkpoints/"
 
async function loadModels(){

    self.modelLstm = await tf.loadLayersModel('checkpoints/modelsFinal_Lstm/model.json');
    self.modelEmb =  await tf.loadLayersModel('checkpoints/modelsFinal_Emb/model_cleaned.json');

    console.log("loaded models");
    tf.setBackend('webgl');
    console.log(tf.getBackend());

    warmupRounds = 2;
    var midiInp = tf.tensor2d([[96, 96]]);
    var cpcInp = tf.tensor2d([[12, 12]]); 
    var rhyInp = tf.tensor2d([[4]]);
    self.states1A = tf.randomNormal([1,600]);
    self.states1B = tf.randomNormal([1,600]);
    self.states2A = tf.randomNormal([1,600]);
    self.states2B = tf.randomNormal([1,600]);

    for (let i = 0; i < warmupRounds; i++) {
        console.log("warmup round", i)
        var exodos = self.modelEmb.predict([midiInp, cpcInp, rhyInp]);
        var embMidi = exodos[0];
        var embCpc = exodos[1];
        var embRhy = exodos[2];
        var embMidiC = tf.concat([embMidi.slice([0,0,0],[1,1,150]),embMidi.slice([0,1,0],[1,1,150])], 2);
        var embCpcC = tf.concat([embCpc.slice([0,0,0],[1,1,150]),embCpc.slice([0,1,0],[1,1,150])], 2);
        var totalInp = tf.concat([embMidiC, embCpcC, embRhy],2);
        var out = self.modelLstm.predict([totalInp, self.states1A, self.states1B, self.states2A, self.states2B]);
    }


}

loadModels()
// self.lastAiPrediction = {'aiInpMidi':96, 'aiInpCpc':12};

self.temperature = 1e-08;
self.counter = 0;

onmessage = function(e) {
    // if (warmUp == 0){
    var data = e.data
    console.log("just entered", " counter is ", self.counter, " tick is ", data['tick'])
    var t1 = performance.now();
    console.log("counter is ", self.counter, " tick is ", data['tick'], "\n", data['aiInp']);

    // console.assert(self.lastAiPrediction['aiInpMidi']==data['aiInp'].midiArticInd)
    var midiInp = tf.tensor2d([[data['aiInp'].midiArticInd, data['humanInpMidi']]]);
    var cpcInp = tf.tensor2d([[data['aiInp'].cpc, data['humanInpCpc']]]); // data['aiInp']['cpc']
    var rhyInp = tf.tensor2d([[data['rhythmInd']]]);

    // console.log( " COUNTER is ", self.counter, "midiInp" + midiInp.arraySync() + "cpcInp" + cpcInp.arraySync() + "rhyInp" + rhyInp.arraySync())

    var exodos = self.modelEmb.predict([midiInp, cpcInp, rhyInp]);
    var embMidi = exodos[0];
    var embCpc = exodos[1];
    var embRhy = exodos[2];
    var embMidiC = tf.concat([embMidi.slice([0,0,0],[1,1,150]),embMidi.slice([0,1,0],[1,1,150])], 2);
    var embCpcC = tf.concat([embCpc.slice([0,0,0],[1,1,150]),embCpc.slice([0,1,0],[1,1,150])], 2);
    var totalInp = tf.concat([embMidiC, embCpcC, embRhy],2);

    var out = self.modelLstm.predict([totalInp, self.states1A, self.states1B, self.states2A, self.states2B]);


    self.states1A = out[1];
    self.states1B = out[2];
    self.states2A = out[3];
    self.states2B = out[4];
    
    var logits = out[0]
    
    var logits_temp = logits.div(self.temperature);
    var predictedNote = tf.multinomial(logits_temp, 2);

    // console.log('counter is ', self.counter, ' pred is ', predictedNote.dataSync()[0], ' mean logit ', logits.mean().dataSync()[0]);
    var t2 = performance.now();
    // console.log("neuralNet: " + (t2`-t1) + " tick " + tick);
    var output = {
        'tick' : data['tick'],
        'midiArticInd' : predictedNote.dataSync()[0]
    }
    self.counter = self.counter + 1
    postMessage(output);
    
}