
const repeatThings = (arr, repeats) => [].concat(...Array.from({ length: repeats }, () => arr)); // a little function to do some repmatting 

function waiter(ms){
    let now = Date.now(), end = now + ms;
    while (now < end) { now = Date.now(); }
}

function randomNoRepeats(array) {
    var copy = array.slice(0);
        return function() {
        if (copy.length < 1) { copy = array.slice(0); }
        var index = Math.floor(Math.random() * copy.length);
        var item = copy[index];
        copy.splice(index, 1);
    return item;
    };
}

/////////////////////////
// stimulusPathFactory //
/////////////////////////

// little function to programmatically generate paths

function stimulusPathFactory(category, exemplar, variant, difficulty, whichPath){
    var stim_path = `https://dev.btrmt.org/stimuli/masked_datasets/${category}/${exemplar}/${difficulty}/${variant}.jpg`;
    var prompt_path = `https://dev.btrmt.org/stimuli/unmasked_datasets/${category}/${exemplar}.JPEG`;
    var mask_path = `https://dev.btrmt.org/stimuli/masks/${category}/${exemplar}.jpg`;
    if (whichPath === 'stimulus') {
        return stim_path;
    } else if (whichPath === 'prompt') {
        // we can also return the images in the prompt button if we like
        return prompt_path;
    } else if (whichPath === 'mask') {
        // we can also return the images in the prompt button if we like
        return mask_path;
    }
}

/////////////////////////
// difficultyTitration //
/////////////////////////

// a function to titrate difficulty in the accuracy mode
// not very pretty, but hopefully legible

function difficultyTitration(thisStimDiff,thisStimLabel, stimulus_difficulty) {
    console.log('titrate difficulty for: ', thisStimLabel);
    console.log('from difficulty: ',thisStimDiff);

        // filter to trials for the relevant stimulus label, then count correct trials
        var last_correct = jsPsych.data.get().filter({
            experiment_part: 'response'
        }).filter({
            stimulus_label: thisStimLabel
        }).last(stimulus_difficulty.history).filter({
            correct: true
        }).count();

        // update stimulus difficulty based on desired accuracy
        var last_accuracy = (last_correct/stimulus_difficulty.history)*100;
    console.log('last accuracy was: ',last_accuracy);
        if (last_accuracy < stimulus_difficulty.accuracy) {
            var newStimDiff = thisStimDiff+1;
        } else if (last_accuracy > stimulus_difficulty.accuracy) {
            var newStimDiff = thisStimDiff-1;
        } else if (last_accuracy == stimulus_difficulty.accuracy) {
            var newStimDiff = thisStimDiff;
        }

        // limit stimulus difficulty to min/max
        if (newStimDiff < stimulus_difficulty.min) {
            newStimDiff = stimulus_difficulty.min;
        } else if (newStimDiff > stimulus_difficulty.max) {
            newStimDiff = stimulus_difficulty.max;
        }
    console.log('new difficulty: ',newStimDiff);

        return newStimDiff;
}

/////////////////
// getStimulus //
/////////////////

// function to put together the stimulus path based on:
//     the trial
//     the array of stimuli
//     and the difficulty

function getStimulus(trial_number, stimDifficulty, stimuli) {
    return stimulusPathFactory(stimuli.labels[stimuli.category_order[trial_number]],stimuli.exemplar_order[trial_number].toString(),stimuli.variant_order[trial_number].toString(),stimDifficulty.toString(),'stimulus');
}

/////////////
// getMask //
/////////////

// function to grab the mask path for the trial

function getMask(trial_number, stimuli) {
    return stimulusPathFactory(stimuli.labels[stimuli.category_order[trial_number]],stimuli.exemplar_order[trial_number].toString(),null,null,'mask');
}

/////////////
// shuffle //
/////////////

var isArray = Array.isArray || function(value) {
    return {}.toString.call(value) !== "[object Array]"
};

function shuffle() {
    var arrLength = 0;
    var argsLength = arguments.length;
    var rnd, tmp;


    for (var index = 0; index < argsLength; index += 1) {
        if (!isArray(arguments[index])) {
            throw new TypeError("Argument is not an array.");
        }

        if (index === 0) {
            arrLength = arguments[0].length;
        }

        if (arrLength !== arguments[index].length) {
            throw new RangeError("Array lengths do not match.");
        }
    }

    while (arrLength) {
        rnd = Math.floor(Math.random() * arrLength);
        arrLength -= 1;
        for (argsIndex = 0; argsIndex < argsLength; argsIndex += 1) {
            tmp = arguments[argsIndex][arrLength];
            arguments[argsIndex][arrLength] = arguments[argsIndex][rnd];
            arguments[argsIndex][rnd] = tmp;
        }
    }
}

////////////////////////////
// random number in range //
////////////////////////////

function randomNumberFrom(min, max) { 
    return Math.floor(Math.random() * (max - min) + min);
} 
