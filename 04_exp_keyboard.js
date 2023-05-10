jatos.onLoad(function() {

// note, we use some functions defined in lib/helperFunctions.js
// expects stimuli to be in `stimuli/masked_datasets/category/exemplar_number/difficulty_level/bubble_variant_number.jpg` where:
//     difficulty_levels are matched to `stimulus_difficulty.valid` in settings
//     bubble_variant_number is a number from 1-stimuli.quantity in settings
//     exemplar_number is a number from 1-stimuli.exemplars in settings
//     category matches stimuli.labels in settings
// expects masks to be in `stimuli/masks/category/exemplar_number.jpg` where:
//     category matches stimuli.labels in settings
//     exemplar_number is a number from 1-stimuli.exemplars in settings
//  expects the image to display during catch trials is at `stimuli.catch-trial.png`

    console.log("starting experiment");

    // pull out our settings from jatos.studySessionData
    var fixation_time = jatos.studySessionData["fixation_time"]; // ms to display fixation
    var stimulus_display_time = jatos.studySessionData["stimulus_display_time"]; // ms to display trial
    var stimulus_blank_time = jatos.studySessionData["stimulus_blank_time"]; // ms to display blank screen after stimulus
    var mask_time = jatos.studySessionData["mask_time"]; // ms to display mask (at start of response period)
    var response_time = jatos.studySessionData["response_time"]; // max time for participant response
    var catch_trials = jatos.studySessionData["catch_trials"]; // after how many trials should there be catch trials?
    var catch_trial_time = jatos.studySessionData["catch_trial_time"]; // how long should we display the catch trial image?
    var catch_trial_feedback_time = jatos.studySessionData["catch_trial_feedback_time"]; // and how long to display feedback afterwards?
    var maxBadCatchTrials = jatos.studySessionData["maxBadCatchTrials"]; // how many bad catch trials should there be?

    // this will work, but will need adjusting (for example, should we tell the participants how long the break is for?)
    var break_trials = jatos.studySessionData["break_trials"] = 0; // after how many trials should there be break trials?
    var break_time = jatos.studySessionData["break_time"] = 0; // and for how long?

    var stimulus_difficulty = jatos.studySessionData["stimulus_difficulty"];

    var stimuli = jatos.studySessionData["stimuli"];
    stimuli.category_order = []; // we'll generate this later
    stimuli.variant_order = []; // generate later
    stimuli.exemplar_order = []; //generate this later
    stimulus_difficulty.order = []; //generate this later
    stimuli.mask_paths = []; // generate for later
    stimuli.prompt_order = []; // generate this later
    stimuli.prompt_html_array = [];// generate this later

    ////////////////////////////////
    /* generate trial information */
    ////////////////////////////////

    console.log("generate trial information");

    // this is balanced by jatos now, so we can leave this here
    stimuli.prompt_order = Array.from({length: stimuli.labels.length}, (e, i)=> i);

    // get total trials to loop through
    if (stimulus_difficulty.adaptive) {
        var trialsRemaining = stimuli.labels.length*stimuli.exemplars_used.length*stimuli.quantity;
    } else {
        var trialsRemaining = stimuli.labels.length*stimuli.exemplars_used.length*stimuli.quantity*stimulus_difficulty.valid.length;
    }

    // put together keys and prompt
    var theseKeys = jatos.studySessionData["keys"].concat(jatos.studySessionData["keys_other"]);
    var thisPrompt = '<p>';
    for (promptIdx = 0; promptIdx < jatos.studySessionData["keys"].length; promptIdx++) {
       thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys"][promptIdx]).toUpperCase()+': '+JSON.stringify(stimuli.labels[promptIdx]);
        if (promptIdx < jatos.studySessionData["keys"].length-1){
            thisPrompt = thisPrompt+'<span style="display: inline-block; margin-left: 40px;"></span>';
        }
    }
    thisPrompt = thisPrompt+'<br><br>';
    thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys_other"][0]).toUpperCase()+': not sure ';
    thisPrompt = thisPrompt+'<span style="display: inline-block; margin-left: 40px;"></span>';
    thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys_other"][1]).toUpperCase()+': none of these</p>';

    // so how many trials do we have now?
    console.log('total trials');
    console.log(trialsRemaining);
    console.log('which will take');
    var totalTrialTime = trialsRemaining*(jatos.studySessionData["fixation_time"]+jatos.studySessionData["response_time"]+jatos.studySessionData["stimulus_display_time"]+jatos.studySessionData["stimulus_blank_time"]); // how many ms
    totalTrialTime = totalTrialTime/1000; // how many s
    totalTrialTime = totalTrialTime/60; // how many mins
    console.log(JSON.stringify(totalTrialTime)+' mins plus catch trials, breaks and instructions (maybe 20-30 mins)');

    // now create anon functions that will select randomly with no repetitions from variants and difficulty
    var selectVariants = [];
    var selectDifficulty = [];
    for (exemplarNum=0; exemplarNum < stimuli.exemplars_used.length; exemplarNum++) {
        selectVariants[exemplarNum] = randomNoRepeats(Array.from({length: stimuli.quantity}, (_, i) => i + 1)); // quick anon function to grab items randomly with no repeats
        // this will only be used if not adaptive difficulty
        selectDifficulty[exemplarNum] = randomNoRepeats(stimulus_difficulty.valid); // quick anon function to grab items randomly with no repeats
    }

    // alrighty, let's loop though the trials to work out what our stimulus order will be
    while (trialsRemaining > 0) {

        // first we'll select random `exemplars_per_block` number of exemplars (and random variants of those exemplars) for this block of labels
        // so if we have 2 exemplars per block, we'll randomly select e.g. 2 of the 16 cars, and of those two, we'll select two bubble variants---one for each
        var randomExemplars = [];
        var randomVariants = [];
        var randomDifficulty = [];
        for (exemplarNum=0; exemplarNum < stimuli.exemplars_per_block; exemplarNum++) {

            // randomly select one of the exemplars we are using
            randomExemplars[exemplarNum] = stimuli.exemplars_used[Math.floor(Math.random() * stimuli.exemplars_used.length)];

            // using the index for that exemplar (i.e. where it exists in exemplars_used), index into the selector functions (because these were created with exemplars_used)
            randomVariants[exemplarNum] = selectVariants[stimuli.exemplars_used.indexOf(randomExemplars[exemplarNum])](); // use the anon function to grab a random variant for this randomly selected exemplar
            // only used if not adaptive
            randomDifficulty[exemplarNum] = selectDifficulty[stimuli.exemplars_used.indexOf(randomExemplars[exemplarNum])](); // use the anon function to grab a random difficulty for this randomly selected exemplar

        }

        // now we loop through labels/categories and map these random stimuli to each label
        // the stimNum variable is the index for the labels
        var tmpExemplars = [];
        var tmpStimuli = [];
        var tmpVariants = [];
        var tmpDifficulties = [];
        for (stimNum=0; stimNum < stimuli.labels.length; stimNum++) {

            // concatenate our randomExemplars for each stimulus category
            tmpExemplars = tmpExemplars.concat(randomExemplars);
            // and concat our variants
            tmpVariants = tmpVariants.concat(randomVariants);
            // and our difficulties (only used if not adaptive)
            tmpDifficulties = tmpDifficulties.concat(randomDifficulty);

            // get an equivalent array so we know what stimuli these exemplars belong to
            tmpStimuli = tmpStimuli.concat(Array(stimuli.exemplars_per_block).fill(stimNum));

            // now we iterate our trials remaining
            trialsRemaining = trialsRemaining-(1*stimuli.exemplars_per_block);
        }
        // by the end of this, we'll have four variables:
        //  tmpExemplars: trial by trial, what exemplar should we show?
        //  tmpStimuli: trial by trial, what category will the exemplar be from? this is an index for the label, not the label itself
        //  tmpVariants: trial by trial, what bubble variant for the exemplar should we show?
        //  tmpDifficulties: trial by trial, what difficulty should this be shown at?

        // now we have a nice order, but we want to shuffle them all up, so that we don't have one category after another
        // this will shuffle all three of our variables in the exact same way
        shuffle(tmpStimuli,tmpExemplars,tmpVariants,tmpDifficulties);

        // now we put that shuffled order into the variable we'll use later to create our trials
        stimuli.category_order = stimuli.category_order.concat(tmpStimuli);
        stimuli.exemplar_order = stimuli.exemplar_order.concat(tmpExemplars);
        stimuli.variant_order = stimuli.variant_order.concat(tmpVariants);
        stimulus_difficulty.order = stimulus_difficulty.order.concat(tmpDifficulties);
    }


    ////////////////////////////
    /* jsPsych trial settings */
    ////////////////////////////
    
// we'll reuse this as a fixation - shows a cross on the screen. can be changed
var fixation = {
    type: 'html-keyboard-response',
    stimulus: '<div style="height: 250px"><p style="font-size: 48px;">+</p></div>',
    choices: jsPsych.NO_KEYS,
    trial_duration: fixation_time,
    data: {experiment_part: 'fixation'} // we use this information to filter trials
};

var break_trial = [
    {
        type: "html-keyboard-response",
        stimulus: '<p>Take a break!<br>You have '+JSON.stringify(jatos.studySessionData["break_time"]/1000/60)+'minutes.</p>',
        choices: jsPsych.NO_KEYS,
        trial_duration: 1000,
        data: {experiment_part: 'break'}
    },
    {
        type: "html-keyboard-response",
        stimulus: '<p>Take a break!<br>You have '+JSON.stringify(jatos.studySessionData["break_time"]/1000/60)+'minutes.<br>Or press any key to continue.</p>',
        trial_duration: break_time,
        data: {experiment_part: 'break'}
    },
];

    // the scaffold for the actual stimulus presentation
    var stimulus_presentation = {
        // if we have the response prompts here, it'll appear in the middle of the screen while the image loads
        // so do image keyboard response
        type: 'image-keyboard-response',
        choices: theseKeys,
        prompt: thisPrompt,
        margin_vertical: 4,
        // stimulus: 'path/to/image', // we specify this dynamically in the trial loop
        stimulus_height: 500,
        stimulus_duration: stimulus_display_time,
        trial_duration: stimulus_display_time+stimulus_blank_time,
        data: {experiment_part: 'presentation'} // we use this information to filter trials
    };

    // the scaffold for our image random masks
    var random_mask = {
        type: 'image-keyboard-response',
        // stimulus: 'stimuli/mask_placeholder.png', // we generate this dynamically in the trial loop
        stimulus_height: 500,
        choices: theseKeys,
        prompt: thisPrompt,
        margin_vertical: 4,
        stimulus_duration: mask_time,
        trial_duration: response_time,
        data: {experiment_part: 'response'} // we use this information to filter trials
    };



    // now create the catch trial
    var badCatchTrials = 0;
    var catch_trial = [
            {
                type: 'image-keyboard-response',
                choices: [theseKeys[0],theseKeys[1]],
                prompt: '<p>'+JSON.stringify(theseKeys[0]).toUpperCase()+': yes '+JSON.stringify(theseKeys[1]).toUpperCase()+': no</p>',
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
                    if (response != theseKeys[0]) { // we assume yes inserted second, so it will be 1 as javascript starts at 0 when counting
                        console.log('bad catch trial');
                        badCatchTrials = badCatchTrials+1;
                        if (badCatchTrials == maxBadCatchTrials) {
                            jsPsych.data.addProperties({attention_failure: 1}); // let's add something so we can filter this dataset out later if we want
                            var thisSessionData = jatos.studySessionData;
                            var thisExpData = JSON.parse(jsPsych.data.get().json());
                            var resultJson = {...thisSessionData, ...thisExpData};
                            jatos.submitResultData(resultJson)
                                .then(() => console.log('failed too many attention checks. data saved, now redirecting'))
                                .then(jatos.endStudyAjax)
                                .then(() => {
                                    window.location.href = jatos.studySessionData["prolificURL"]+jatos.studySessionData["prolificCodeFail"];
                                });
                            // comment this out, since we'll redirect to prolific and that will tell them
                            // jsPsych.endExperiment('The experiment was ended: too many failed attention checks.') // this message doesn't show?
                            // document.body.innerHTML = 'The experiment was ended: too many failed attention checks :(';  // so let's add the text ourselves
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


    ////////////////////////////
    /* experiment constructor */
    ////////////////////////////

    console.log("construct experiment");

    /* initialise timeline array */

    var timeline = [];

    var thisDifficulty = stimulus_difficulty.default;

    /* commence generating trials */

    timeline.push(
        {
            type: 'html-keyboard-response',
            stimulus: '<p>Great! Now lets do the task for real. Good luck!</p>',
            choices: jsPsych.NO_KEYS,
            trial_duration: 1000,
            response_ends_trial: false
        },
        { // requires html stimulus entry in previous trial
            type: 'html-keyboard-response',
            stimulus: function() {
                var last_stim = jsPsych.data.get().last(1).values()[0].stimulus;
                var addcontinue = last_stim+'<p style="position: fixed; bottom: 0; left: 50%; transform: translate(-50%, -50%); margin: 0 auto;"><br>Press any key to continue</p>';
                return addcontinue;
            }
        }
    );

    if (jatos.studySessionData["experiment_on"] === 1) {

        timeline.push(
            {
                type: 'preload',
                images: jatos.studySessionData["stimuli"].preloadPaths,
            },
        );


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
            var trialsBeforeFeedback = 24;
            if (trial != 0) {
                if (trial % trialsBeforeFeedback === 0) {
                    timeline.push(
                        {
                            type: 'html-keyboard-response',
                            choices: jsPsych.NO_KEYS,
                            trial_duration: catch_trial_feedback_time,
                            stimulus: function() {
                                var lastCorrect = 0;
                                var lastTrials = jsPsych.data.get().filter({experiment_part: 'response'}).last(trialsBeforeFeedback).values();
                                for (corrIdx = 0; corrIdx < lastTrials.length; corrIdx++) {
                                   if (lastTrials[corrIdx].correct) {
                                        lastCorrect++;
                                   }
                                }
                                var percentageCorrect = Math.round((lastCorrect/trialsBeforeFeedback)*100);
                                console.log('last correct: ', lastCorrect)
                                console.log('percentage correct: ', percentageCorrect)
                                return '<div style="height: 250px"><p style="font-size: 48px; color: green;">You are averaging '+JSON.stringify(percentageCorrect)+'% correct.</p></div>';
                            },
                            data: {experiment_part: 'exp_feedback'}, // we use this information to filter trials
                            on_finish: function(){
                                // send the results to jatos in case of failure (will override existing)
                                var thisSessionData = jatos.studySessionData;
                                var thisExpData = JSON.parse(jsPsych.data.get().json());
                                var resultJson = {...thisSessionData, ...thisExpData};
                                jatos.submitResultData(resultJson)
                                   .then(() => console.log('data submitted, results saved'));
                                console.log('results saved');
                            }
                        }
                    );
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
                                stimulus_difficulty.default,
                                stimuli
                            );
                        },
                    },
                    {...random_mask,
                        stimulus: function() {
                            return getMask(
                                jsPsych.data.get().last(2).values()[0].trial_num,
                                stimuli // refer to that index we made earlier 
                            );
                        },
                        on_finish: function(data) {
                            // code for correctness
                            var response = jsPsych.data.get().last(1).values()[0].response;
                            var stimulus_index = jsPsych.data.get().last(3).values()[0].trial_num; // refer to that index we made earlier

                            if (theseKeys.indexOf(response) == stimuli.category_order[stimulus_index]) {
                                console.log('correct')
                                data.correct = true;
                            } else {
                                console.log('incorrect')
                                data.correct = false;
                            }

                            data.response_label = stimuli.labels[theseKeys.indexOf(response)];

                            if (data.response_label === undefined) {
                                if (response == jatos.studySessionData["keys_other"][1]) {
                                    console.log('none of these')
                                    data.response_label = 'none_of_these'
                                } else if (response == jatos.studySessionData["keys_other"][0]) {
                                    console.log('not sure')
                                    data.response_label = 'not_sure'
                                } else {
                                    console.log('invalid')
                                    data.response_label = 'invalid'
                                }
                            }

                            data.stimulus_label = stimuli.labels[stimuli.category_order[stimulus_index]];
                            data.stimulus_variant = stimuli.variant_order[stimulus_index];
                            data.stimulus_exemplar = stimuli.exemplar_order[stimulus_index];
                            data.stimulus_difficulty = thisDifficulty;

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
                                thisDifficulty,
                                stimuli
                            );
                        },
                    },
                    {...random_mask,
                        stimulus: function() {
                            return getMask(
                                jsPsych.data.get().last(2).values()[0].trial_num,
                                stimuli // refer to that index we made earlier
                            );
                        },
                        on_finish: function(data) {
                            // code for correctness
                            var response = jsPsych.data.get().last(1).values()[0].response;
                            var stimulus_index = jsPsych.data.get().last(3).values()[0].trial_num; // refer to that index we made earlier

                            // do response-type specific coding
                            if (theseKeys.indexOf(response) == stimuli.category_order[stimulus_index]) {
                                console.log('correct')
                                data.correct = true;
                            } else {
                                console.log('incorrect')
                                data.correct = false;
                            }
                            data.response_label = stimuli.labels[theseKeys.indexOf(response)];
                            if (data.response_label === undefined) {
                                data.response_label = 'not sure or none of these'
                            }

                            data.stimulus_label = stimuli.labels[stimuli.category_order[stimulus_index]];
                            data.stimulus_variant = stimuli.variant_order[stimulus_index];
                            data.stimulus_exemplar = stimuli.exemplar_order[stimulus_index];
                            data.stimulus_difficulty = thisDifficulty;

                            // adjust difficulty
                            thisLabel = stimuli.labels[stimuli.category_order[stimulus_index]];
                            if (stimulus_difficulty.adaptive === false) {
                                thisDifficulty = stimulus_difficulty.order[stimulus_index];
                            } else {
                                thisDifficulty = difficultyTitration(thisDifficulty,thisLabel,stimulus_difficulty);
                            }
                        }
                    },
                );
            }
        }

    } else {
        timeline.push(
            {
                type: 'html-keyboard-response',
                stimulus: '<div><p>skipping experiment</p></div>',
                choices: jsPsych.NO_KEYS,
                trial_duration: 300,
            },
        );
    }

    jsPsych.init({
        timeline: timeline,
        on_finish: function() {
            var time = jsPsych.totalTime();
            jsPsych.data.addProperties({
                expt_duration: time,
            });
            var thisSessionData = jatos.studySessionData;
            var thisExpData = JSON.parse(jsPsych.data.get().json());
            var resultJson = {...thisSessionData, ...thisExpData};
            jatos.submitResultData(resultJson, jatos.startNextComponent);
        }
    });
});
