

/////////////////////////
// stimulusPathFactory //
/////////////////////////

// little function to programmatically generate paths

function stimulusPathFactory(label, variant, difficulty, whichPath){
    var stim_path = `stimuli/masked_datasets/${label}/${difficulty}/${variant}.jpg`;
    var prompt_path = `stimuli/unmasked_datasets/${label}.jpg`;
    var mask_path = `stimuli/masks/${label}.jpg`;
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

function difficultyTitration(thisStimDiff) {
    console.log('titrate difficulty');
    console.log('from difficulty: ',thisStimDiff);

        // filter to trials, then count correct trials
        var last_correct = jsPsych.data.get().filter({
            experiment_part: 'response'
        }).last(stimulus_difficulty.history).filter({correct: true}).count();

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

function getStimulus(trial_number, stimDifficulty) {
    return stimulusPathFactory(stimuli.labels[stimuli.order[trial_number]],stimuli.variant_order[trial_number].toString(),stimDifficulty.toString(),'stimulus');
}

/////////////
// getMask //
/////////////

// function to grab the mask path for the trial

function getMask(trial_number) {
    return stimulusPathFactory(stimuli.labels[stimuli.order[trial_number]],null,null,'mask');
}
