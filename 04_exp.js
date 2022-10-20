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
    var fixation_time = jatos.studySessionData["fixation_time"] = 200; // ms to display fixation
    var stimulus_display_time = jatos.studySessionData["stimulus_display_time"] = 150; // ms to display trial
    var stimulus_blank_time = jatos.studySessionData["stimulus_blank_time"] = 130; // ms to display blank screen after stimulus
    var mask_time = jatos.studySessionData["mask_time"] = 180; // ms to display mask (at start of response period)
    var response_time = jatos.studySessionData["response_time"] = 2000; // max time for participant response
    var catch_trials = jatos.studySessionData["catch_trials"] = 20; // after how many trials should there be catch trials?
    var catch_trial_time = jatos.studySessionData["catch_trial_time"] = stimulus_display_time+100; // how long should we display the catch trial image?
    var catch_trial_feedback_time = jatos.studySessionData["catch_trial_feedback_time"] = response_time; // and how long to display feedback afterwards?
    var maxBadCatchTrials = jatos.studySessionData["maxBadCatchTrials"] = 10; // how many bad catch trials should there be?

    // this will work, but will need adjusting (for example, should we tell the participants how long the break is for?)
    var break_trials = jatos.studySessionData["break_trials"] = 0; // after how many trials should there be break trials?
    var break_time = jatos.studySessionData["break_time"] = 0; // and for how long?

    var stimulus_difficulty = jatos.studySessionData["stimulus_difficulty"];

    var stimuli = jatos.studySessionData["stimuli"];
    stimuli.category_order: [], // we'll generate this later
    stimuli.variant_order: [], // generate later
    stimuli.exemplar_order: [], //generate this later
    stimuli.stimuli_paths: [], // generate this later for preloading images
    stimuli.mask_paths: [], // generate for later
    stimuli.prompt_paths:  [], // generate this later for preloading images
    stimuli.prompt_order: [], // generate this later
    stimuli.prompt_html_array: [] // generate this later

    ////////////////////////////////
    /* generate trial information */
    ////////////////////////////////

    console.log("generate trial information");

    // counterbalance this when we move it into JATOS and can do batch control
    stimuli.prompt_order = Array.from({length: stimuli.labels.length}, (e, i)=> i);

    // get total trials to loop through
    var trialsRemaining = stimuli.labels.length*stimuli.exemplars*stimuli.quantity;

    // now we make an order from stimulus_difficulty.order (if it exists)
    if (stimulus_difficulty.adaptive === true) {
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
    // and add to the jsPsych init, under timeline
    // preload_images: [stimuli.stimuli_paths, stimuli.prompt_paths, stimuli.mask_paths],

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
                        data.response_label = stimuli.labels[stimuli.prompt_order[response]];
                        if(data.response_label === undefined){data.response_label = 'not sure or none of these'}
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
                        data.response_label = stimuli.labels[stimuli.prompt_order[response]];
                        if(data.response_label === undefined){data.response_label = 'not sure or none of these'}
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
