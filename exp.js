// expects to be wrapped in an html file
// note, we use some functions defined in lib/helperFunctions.js

// when we put this into JATOS, we want to:
// counterbalance the response prompts
// select/randomise the categories
// alter the exemplars and exemplars per block and the number of variants (stimuli.quantity)

console.log("starting experiment");

///////////////////
/* set up params */
///////////////////

var fixation_time = 200 // ms to display fixation
var stimulus_display_time = 150; // ms to display trial
var stimulus_blank_time = 130; // ms to display blank screen after stimulus
var mask_time = 180; // ms to display mask
var response_time = 2000; // max time for participant response

var stimulus_difficulty = {
    valid: [1,2,3,4,5], // valid stimulus difficulties, should correspond to folder names
    default: 3, // default stim difficulty (used for first trials to establish accuracy)
    min: 1, // min stimulus difficulty (to limit titration from going too far down)
    max: 5, // max stimulus difficulty (to limit titration from going too far up)
    accuracy: 50, // percentage difficulty to titrate to
    history: 4, // number of trials to check accuracy over
};

var stimuli = {
    labels: [ // should be equal to image category and category folder name, used as response prompt name also
        'car',
        'elephant',
        'fish',
        'hammer',
        'hand_blower',
        'hat',
        'iron',
        'ladybug',
        'pineapple',
        'pot',
        'sewing_machine',
        'violin',
    ],
    exemplars: 16, // quantity of exemplars of each category
    exemplars_per_block: 2, // number of exemplars to include in each block
    quantity: 100, // quantity of variants of each image exemplar
    category_order: [], // we'll generate this later
    variant_order: [], // generate later
    exemplar_order: [], //generate this later
    stimuli_paths: [], // generate this later for preloading images
    mask_paths: [], // generate for later
    prompt_paths:  [], // generate this later for preloading images
    prompt_order: [], // generate this later
    prompt_html_array: [] // generate this later
};

////////////////////////////////
/* generate trial information */
////////////////////////////////


console.log("generate trial information");

// counterbalance this when we move it into JATOS and can do batch control
stimuli.prompt_order = Array.from({length: stimuli.labels.length}, (e, i)=> i);

// get total trials to loop through
var trialsRemaining = stimuli.labels.length*stimuli.exemplars*stimuli.quantity;

// alrighty, let's loop though our trials to work out what our stimulus order will be
while (trialsRemaining > 0) {

    // first we'll select random `exemplars_per_block` number of exemplars (and random variants of those exemplars) for this block of labels
    // so if we have 2 exemplars per block, we'll randomly select e.g. 2 of the 16 cars, and of those two, we'll select two bubble variants---one for each
    var randomExemplars = [];
    var randomVariants = [];
    for (exemplarNum=0; exemplarNum < stimuli.exemplars_per_block; exemplarNum++) {
        randomExemplars[exemplarNum] = randomNumberFrom(1,stimuli.exemplars);
        randomVariants[exemplarNum] = randomNumberFrom(1,stimuli.quantity);
    }

    // now we loop through labels/categories and map these random stimuli to each label
    // the stimNum variable is the index for the labels
    var tmpExemplars = [];
    var tmpStimuli = [];
    var tmpVariants = [];
    for (stimNum=0; stimNum < stimuli.labels.length; stimNum++) {

        // concatenate our randomExemplars for each stimulus category
        tmpExemplars = tmpExemplars.concat(randomExemplars);

        // get an equivalent array so we know what stimuli these exemplars belong to
        tmpStimuli = tmpStimuli.concat(Array(stimuli.exemplars_per_block).fill(stimNum));

        // and concat our variants
        tmpVariants = tmpVariants.concat(randomVariants);

        // now we iterate our trials remaining
        trialsRemaining = trialsRemaining-(1*stimuli.exemplars_per_block);
    }
    // by the end of this, we'll have three variables:
    //  tmpExemplars: trial by trial, what exemplar should we show?
    //  tmpStimuli: trial by trial, what category will the exemplar be from? this is an index for the label, not the label itself
    //  tmpVariants: trial by trial, what bubble variant for the exemplar should we show?

    // now we have a nice order, but we want to shuffle them all up, so that we don't have one category after another
    // this will shuffle all three of our variables in the exact same way
    shuffle(tmpStimuli,tmpExemplars,tmpVariants);

    // now we put that shuffled order into the variable we'll use later to create our trials
    stimuli.category_order = stimuli.category_order.concat(tmpStimuli);
    stimuli.exemplar_order = stimuli.exemplar_order.concat(tmpExemplars);
    stimuli.variant_order = stimuli.variant_order.concat(tmpVariants);
}

// we're probably going to want to preload images, so:
// https://www.jspsych.org/7.1/overview/media-preloading/#manual-preloading
//for (diff = 0; diff < stimulus_difficulty.valid.length; diff++) {
//    diffMod = diff+1; // add one because js starts at 0
//    repMod = rep+1; // add one because js starts at 0
//    // generate these to preload the images
//    stimuli.stimuli_paths = stimuli.stimuli_paths.concat(stimulusPathFactory(stimuli.labels[i],exemplarMod.toString(),repMod.toString(),diffMod.toString(),'stimulus'));
//}

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


////////////////////////////
/* experiment constructor */
////////////////////////////

console.log("construct experiment");

/* initialise timeline array */

var timeline = [];

var thisDifficulty = stimulus_difficulty.default;

/* commence generating trials */

for (trial = 0; trial < stimuli.category_order.length; trial++) {
    if (trial < stimulus_difficulty.history) {
        // add enough trials to start checking history for accuracy
        timeline.push(
            {...fixation,
                data: {...fixation.data,
                    trial_num: trial // make an index we can refer to in later trials if we need
                }
            },
            {...stimulus_presentation,
                stimulus: function() {
                    console.log('using default difficulty to establish baseline');
                    return getStimulus(
                        jsPsych.data.get().last(1).values()[0].trial_num, // refer to that index we made earlier
                        stimulus_difficulty.default
                    );
                },
            },
            {...random_mask,
                stimulus: function() {
                    return getMask(
                        jsPsych.data.get().last(2).values()[0].trial_num // refer to that index we made earlier 
                    );
                },
                on_finish: function(data) {
                    // code for correctness
                    var response = jsPsych.data.get().last(1).values()[0].response;
                    var stimulus_index = jsPsych.data.get().last(3).values()[0].trial_num; // refer to that index we made earlier

                    if (stimuli.prompt_order[response] == stimuli.category_order[stimulus_index]) {
                        console.log('correct')
                        data.correct = true;
                    } else {
                        console.log('incorrect')
                        data.correct = false;
                    }
                    data.response_label = stimuli.labels[stimuli.prompt_order[stimulus_index]];
                    data.stimulus_label = stimuli.labels[stimuli.category_order[stimulus_index]];
                    data.stimulus_variant = stimuli.variant_order[stimulus_index];
                }
            },
        );
    } else {
        timeline.push(
            {...fixation,
                data: {...fixation.data,
                    trial_num: trial
                }
            },
            {...stimulus_presentation,
                stimulus: function() {
                    return getStimulus(
                        jsPsych.data.get().last(1).values()[0].trial_num, // use the index we specified in fixation
                        thisDifficulty
                    );
                },
            },
            {...random_mask,
                stimulus: function() {
                    return getMask(
                        jsPsych.data.get().last(2).values()[0].trial_num // refer to that index we made earlier
                    );
                },
                on_finish: function(data) {
                    // code for correctness
                    var response = jsPsych.data.get().last(1).values()[0].response;
                    var stimulus_index = jsPsych.data.get().last(3).values()[0].trial_num; // refer to that index we made earlier
                    if (stimuli.prompt_order[response] == stimuli.category_order[stimulus_index]) {
                        console.log('correct')
                        data.correct = true;
                    } else {
                        console.log('incorrect')
                        data.correct = false;
                    }
                    data.response_label = stimuli.labels[stimuli.prompt_order[stimulus_index]];
                    data.stimulus_label = stimuli.labels[stimuli.category_order[stimulus_index]];
                    data.stimulus_variant = stimuli.variant_order[stimulus_index];

                    // adjust difficulty
                    thisLabel = stimuli.labels[stimuli.category_order[stimulus_index]];
                    thisDifficulty = difficultyTitration(thisDifficulty,thisLabel);
                }
            },
        );
    }
}

////////////////////////
/* initialise jsPsych */
////////////////////////

console.log("initialise jsPsych");

jsPsych.init({
    timeline: timeline,
    preload_images: [stimuli.stimuli_paths, stimuli.prompt_paths, stimuli.mask_paths],
    on_finish: function() {
        jsPsych.data.displayData();
    }
});
