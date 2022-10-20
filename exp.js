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

// trials go: fixation_time -> stimulus_display_time -> stimulus_blank_time -> mask_time -> response_time-mask_time
//            fixation ------> stimulus --------------> nothing -------------> mask ------> nothing --------------|

var fixation_time = 200 // ms to display fixation
var stimulus_display_time = 150; // ms to display trial
var stimulus_blank_time = 130; // ms to display blank screen after stimulus
var mask_time = 180; // ms to display mask (at start of response period)
var response_time = 2000; // max time for participant response
var catch_trials = 20; // after how many trials should there be catch trials?
var catch_trial_time = stimulus_display_time+100; // how long should we display the catch trial image?
var catch_trial_feedback_time = response_time; // and how long to display feedback afterwards?
var maxBadCatchTrials = 10; // how many bad catch trials should there be?

// this will work, but will need adjusting (for example, should we tell the participants how long the break is for?)
var break_trials = 0; // after how many trials should there be break trials?
var break_time = 0; // and for how long?

var stimulus_difficulty = {
    valid: [1,2,3,4,5], // valid stimulus difficulties, should correspond to folder names
    default: 3, // default stim difficulty (used for first trials to establish accuracy)
    min: 1, // min stimulus difficulty (to limit titration from going too far down)
    max: 5, // max stimulus difficulty (to limit titration from going too far up)
    accuracy: 50, // percentage difficulty to titrate to
    history: 4, // number of trials to check accuracy over
    adaptive: false, // true (will titrate difficulty to `accuracy`) | false (will set difficulty to `order`)
    order: [], // will repmat whatever values you put in here if stimulus_difficulty.adaptive is true, and if the result doesn't evenly fit the amount of trials, it will add however many trials are left of the 0th element (so e.g. if [1,2,3], will repmat [1,2,3,1,2,3...] and if the result doesn't fit the number of trials, it will finish up by adding as many 1s as it needs [...1,2,3,1,1]. You can repmat here with `repeatThings(array,repetitions)`.
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

// for settings file, just have this (minus the ones we don't code) and pass it into one of two files: one training (with additional training labels and training length), and one real---each takes in the stimuli and difficulty information and recodes them for their purposes
// can break up these parts below into distinct chunks: trial pieces obviously one, trial inforamtion probably the difference maker, and the trial constructor too

////////////////////////////////
/* generate trial information */
////////////////////////////////


console.log("generate trial information");

// counterbalance this when we move it into JATOS and can do batch control
stimuli.prompt_order = Array.from({length: stimuli.labels.length}, (e, i)=> i);

// get total trials to loop through
var trialsRemaining = stimuli.labels.length*stimuli.exemplars*stimuli.quantity;

// now we make an order from stimulus_difficulty.order (if it exists)
if (stimulus_difficulty.order) {
    var theseSegments = Math.floor(trialsRemaining/stimulus_difficulty.order.length); // divide the trials evenly into as many segments there are difficulty orders
    stimulus_difficulty.order = repeatThings(stimulus_difficulty.order,theseSegments);
    if (stimulus_difficulty.order.length != trialsRemaining) {
        var makeTheDifference = trialsRemaining-stimulus_difficulty.order.length;
        console.log('adding ',makeTheDifference,' trials of ',stimulus_difficulty.order[0],' difficulty level to the end');
        stimulus_difficulty.order.concat(repeatThings(stimulus_difficulty.order[0],makeTheDifference));
        // this is not rigorously tested
    }
    console.log('stimulus difficulty order generated: ',stimulus_difficulty.order);
}

// we can divide trialsRemaining by the variables in stimulus_difficulty.order to determine how many trials allocated to each difficulty
// then in the loop below, when trialsRemaining =< allocation, make stimulus difficulty x in that array.

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

////////////////////////////
/* experiment constructor */
////////////////////////////

console.log("construct experiment");

/* initialise timeline array */

var timeline = [];

var thisDifficulty = stimulus_difficulty.default;

/* commence generating trials */

for (trial = 0; trial < stimuli.category_order.length; trial++) {
    
    // insert our catch and break trials if needed
    if (catch_trials != 0 && trial != 0) {
        if (trial % catch_trials === 0) {
            timeline.push(...catch_trial); // we need to spread this, because it has two trials---the catch trial and the feedback trial
        }
    }
    if (break_trials != 0 && trial != 0) {
        if (trial % break_trials === 0) {
            timeline.push(break_trial);
        }
    }

    // now check what kind of experimental trial to insert
    if (trial < stimulus_difficulty.history && stimulus_difficulty.adaptive != true) {
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
                    if (stimulus_difficulty.adaptive === true) {
                        thisDifficulty = stimulus_difficulty.order[stimulus_index];
                    } else {
                        thisDifficulty = difficultyTitration(thisDifficulty,thisLabel);
                    }
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
