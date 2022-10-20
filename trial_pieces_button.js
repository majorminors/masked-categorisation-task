////////////////////////////
/* jsPsych trial settings */
////////////////////////////

console.log("generate trial settings");

// first we just create our jsPsych 'trial' variables so we can use them later

// we'll reuse this as a fixation - shows a cross on the screen. can be changed
var fixation = {
    type: 'html-keyboard-response',
    stimulus: '<div style="height: 250px"><p style="font-size: 48px;">+</p></div>',
    choices: jsPsych.NO_KEYS,
    trial_duration: fixation_time,
    data: {experiment_part: 'fixation'} // we use this information to filter trials
};

// now we create the scaffold for our image random masks
var random_mask = {
    type: 'image-button-response',
    // stimulus: 'stimuli/mask_placeholder.png', // we generate this dynamically in the trial loop
    stimulus_height: 500,
    choices: stimuli.labels.concat('none of these','not sure'),
    button_html: '<button class="jspsych-btn" style="width: 150px">%choice%</button>',
    margin_vertical: 4,
    stimulus_duration: mask_time,
    trial_duration: response_time,
    data: {experiment_part: 'response'} // we use this information to filter trials
};

// now the scaffold for the actual stimulus presentation
var stimulus_presentation = {
    // if we have the response prompts here, it'll appear in the middle of the screen while the image loads
    // so do image keyboard response
    type: 'image-button-response',
    choices: stimuli.labels.concat('none of these','not sure'),
    button_html: '<button class="jspsych-btn" style="width: 150px">%choice%</button>',
    margin_vertical: 4,
    // stimulus: 'path/to/image', // we specify this dynamically in the trial loop
    stimulus_height: 500,
    stimulus_duration: stimulus_display_time,
    trial_duration: stimulus_display_time+stimulus_blank_time,
    data: {experiment_part: 'presentation'} // we use this information to filter trials
};

// now create the catch trial
var badCatchTrials = 0;
var catch_trial = [
        {
            type: 'image-button-response',
            choices: ['no','yes', ...stimuli.labels],
            button_html: '<button class="jspsych-btn" style="width: 150px">%choice%</button>',
            margin_vertical: 4,
            stimulus: 'stimuli/catch-trial.png', // we need to create this
            stimulus_height: 500,
            stimulus_duration: catch_trial_time,
            trial_duration: response_time,
            data: {experiment_part: 'catchTrial'} // we can use this information to filter trials
        },
        {
            type: "html-keyboard-response",
            stimulus: function() {
                var response = jsPsych.data.get().last(1).values()[0].response;
                if (response != 1) { // we assume yes inserted second, so it will be 1 as javascript starts at 0 when counting
                    console.log('bad catch trial');
                    badCatchTrials = badCatchTrials+1;
                    if (badCatchTrials == maxBadCatchTrials) {
                        jsPsych.data.addProperties({attention_failure: 1}); // let's add something so we can filter this dataset out later
                        jsPsych.endExperiment('The experiment was ended: too many failed attention checks :)'); // don't know why jsPsych has text in there, it doesn't show
                        document.body.innerHTML = 'The experiment was ended: too many failed attention checks :(';  // so let's add the text ourselves
                    }
                    return '<p>incorrect<br>'
                        +JSON.stringify(badCatchTrials)
                        +' failed attention checks of '
                        +JSON.stringify(maxBadCatchTrials)
                        +'<br>Please pay attention or we will not be able to continue!</p>';
                } else { // else if false
                    return "<p>correct!<br>thanks for paying attention.</p>";
                }
            },
            choices: jsPsych.NO_KEYS,
            trial_duration: catch_trial_feedback_time,
            data: {experiment_part: 'catchTrial-feedback'}
        }
];

// and create a break trial
var break_trial = {
    type: "html-keyboard-response",
    stimulus: '<p>Take a break!</p>',
    choices: jsPsych.NO_KEYS,
    trial_duration: break_time,
    data: {experiment_part: 'break'}
};
