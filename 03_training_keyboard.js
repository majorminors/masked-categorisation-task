jatos.onLoad(function() {

    var skipTraining = 0;

    if (skipTraining == 1) {

        var timeline = [
            {
                type: 'html-keyboard-response',
                stimulus: '<div><p>skipping training</p></div>',
                choices: jsPsych.NO_KEYS,
                trial_duration: 300,
            }
        ];
        
    } else {

        console.log("starting training");

        // this is all copied SELECTIVELY from exp.js unless otherwise stated
        // so if you make changes there, make sure the line/lines are update here

        var fixation_time = jatos.studySessionData["fixation_time"]; // ms to display fixation
        var stimulus_display_time = jatos.studySessionData["stimulus_display_time"]; // ms to display trial
        var stimulus_blank_time = jatos.studySessionData["stimulus_blank_time"]; // ms to display blank screen after stimulus
        var mask_time = jatos.studySessionData["mask_time"]; // ms to display mask (at start of response period)
        var response_time = jatos.studySessionData["response_time"]; // max time for participant response

        var stimulus_difficulty = jatos.studySessionData["stimulus_difficulty"];

        var stimuli = jatos.studySessionData["stimuli"];

        ///////////////////////////////////////////////
        /* replace stimulus labels with train labels */
    // THIS IS NOT WORKING! CHANGES EVERY `stimuli` including the studySessionData one!
    //    stimuli.labels = stimuli.trainLabels;
        /* different from exp.js                     */
        ///////////////////////////////////////////////

        stimuli.category_order = []; // we'll generate this later
        stimuli.variant_order = []; // generate later
        stimuli.exemplar_order = []; //generate this later
        stimuli.mask_paths = []; // generate for later
        stimuli.prompt_order = []; // generate this later
        stimuli.prompt_html_array = [];// generate this later

        console.log("generate trial information");

        // this is balanced by jatos now, so we can leave this here
        stimuli.prompt_order = Array.from({length: stimuli.labels.length}, (e, i)=> i);

        // get total trials to loop through
        var trialsRemaining = stimuli.labels.length*stimuli.exemplars*stimuli.quantity;

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
        thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys_other"][0]).toUpperCase()+': not sure';
        thisPrompt = thisPrompt+'<span style="display: inline-block; margin-left: 40px;"></span>';
        thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys_other"][1]).toUpperCase()+': none of these</p>';


        // alrighty, let's loop though our trials to work out what our stimulus order will be
        while (trialsRemaining > 0) {

            // first we'll select random `exemplars_per_block` number of exemplars (and random variants of those exemplars) for this block of labels
            // so if we have 2 exemplars per block, we'll randomly select e.g. 2 of the 16 cars, and of those two, we'll select two bubble variants---one for each
            var randomExemplars = [];
            var randomVariants = [];
            for (exemplarNum=0; exemplarNum < stimuli.exemplars_per_block; exemplarNum++) {
                randomExemplars[exemplarNum] = stimuli.exemplars_used[Math.floor(Math.random() * stimuli.exemplars_used.length)];
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


        console.log("construct experiment");

        // we'll reuse this as a fixation - shows a cross on the screen. can be changed
        var fixation = {
            type: 'html-keyboard-response',
            stimulus: '<div style="height: 250px"><p style="font-size: 48px;">+</p></div>',
            choices: jsPsych.NO_KEYS,
            trial_duration: fixation_time,
            data: {experiment_part: 'fixation'} // we use this information to filter trials
        };

        // feedback
        var trnFeedback = {
            type: 'html-keyboard-response',
            choices: jsPsych.NO_KEYS,
            trial_duration: fixation_time,
            data: {experiment_part: 'trn_feedback'} // we use this information to filter trials
        };

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


        /* initialise timeline array */

        var timeline = [];

        timeline.push(
            {
                type: 'preload',
                images: jatos.studySessionData["stimuli"].preloadPaths,
            },
        );

        ///////////////////////////////////////////////
        /* replace stimulus difficulty with training */
        var thisDifficulty = stimulus_difficulty.training;
        /* different from exp.js                    */
        //////////////////////////////////////////////

        /* commence generating trials */

        ////////////////////////////////
        /* instructions for training */
        timeline.push(
            {
                type: 'html-keyboard-response',
                stimulus: '<p>Ok! Lets do some practice. You need to get '+JSON.stringify(jatos.studySessionData["training_correct"])+' correct to continue.</p>',
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
        /* different from exp.js                    */
        //////////////////////////////////////////////
        

        ////////////////////////////////////////
        /* a variable to count correct trials */
        var trainingCounter = 0;
        /* different from exp.js              */
        ////////////////////////////////////////

        if (jatos.studySessionData["training_on"] === 1) {

            for (trial = 0; trial < stimuli.category_order.length; trial++) {

                // arbitrary split to insert a 'none of these' trial
                if (trainingCounter % Math.round(jatos.studySessionData["training_correct"]/3)) {
                    timeline.push(
                        {...fixation,
                            data: {...fixation.data,
                                trial_num: trial
                            }
                        },
                        {...stimulus_presentation,
                            stimulus: function(){
                                var noneOfTheseLabel = jatos.studySessionData["stimuli"].labels.filter(x => !jatos.studySessionData["stimuli"].exemplars_used.includes(x))[0];
                                return stimulusPathFactory(noneOfTheseLabel, thisExemplar, variant(), 5, 'stimulus');
                            }
                        },
                        {...random_mask,
                            stimulus: function() {
                                var noneOfTheseLabel = jatos.studySessionData["stimuli"].labels.filter(x => !jatos.studySessionData["stimuli"].exemplars_used.includes(x))[0];
                                return stimulusPathFactory(noneOfTheseLabel, thisExemplar, null, null, 'mask');
                            },
                            on_finish: function(data) {
                                if (theseKeys.indexOf(response) != jatos.studySessionData["keys_other"][1]) {
                                    console.log('correct')
                                    data.correct = true;
                                } else {
                                    console.log('incorrect')
                                    data.correct = false;
                                }
                            }
                        },
                        {...trnFeedback,
                            stimulus: function() {
                                lastCorrect = jsPsych.data.get().last(1).values()[0].correct;
                                if (lastCorrect == true) {
                                    return '<div style="height: 250px"><p style="font-size: 48px; color: green;">correct!</p></div>';
                                } else {
                                    return '<div style="height: 250px"><p style="font-size: 48px; color: red;">incorrect---that was none of the response options shown</p></div>';
                                }
                            }
                        },
                    );
                }

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
                                jsPsych.data.get().last(2).values()[0].trial_num, // refer to that index we made earlier
                                stimuli 
                            );
                        },
                        on_finish: function(data) {
                            // code for correctness
                            var response = jsPsych.data.get().last(1).values()[0].response;
                            var stimulus_index = jsPsych.data.get().last(3).values()[0].trial_num; // refer to that index we made earlier

                            // do response-type specific coding
                            console.log(stimuli.category_order[stimulus_index])
                            console.log(response)
                            console.log(theseKeys.indexOf(response))
                            if (theseKeys.indexOf(response) == stimuli.category_order[stimulus_index]) {
                                console.log(theseKeys.indexOf(response))
                                console.log('correct')
                                data.correct = true;
                            } else {
                                console.log(theseKeys.indexOf(response))
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

                            ////////////////////////////////////////
                            /* adjust our training countertrials */
                            if (data.correct === true) {
                                trainingCounter++;
                            }
                            if (trainingCounter >= jatos.studySessionData["training_correct"]) {
                                jsPsych.endExperiment('correct training trials achieved');
                            }
                            /* different from exp.js              */
                            ////////////////////////////////////////

                        }
                    },
                    {...trnFeedback,
                        stimulus: function() {
                            lastCorrect = jsPsych.data.get().last(1).values()[0].correct;
                            if (lastCorrect == true) {
                                return '<div style="height: 250px"><p style="font-size: 48px; color: green;">correct!</p></div>';
                            } else {
                                return '<div style="height: 250px"><p style="font-size: 48px; color: red;">incorrect!</p></div>';
                            }
                        }
                    },
                );

            }
        } else {
            timeline.push(
                {
                    type: "html-keyboard-response",
                    stimulus: "<p>skipping training</p>",
                },
            );
        }

    } // end of skip instructions if statement

    jsPsych.init({
        timeline: timeline,
        on_finish: function() {
            var time = jsPsych.totalTime();
            jsPsych.data.addProperties({
                expt_duration: time,
                training: 1,
            });
            var thisSessionData = jatos.studySessionData;
            var thisExpData = JSON.parse(jsPsych.data.get().json());
            var resultJson = {...thisSessionData, ...thisExpData};
            jatos.submitResultData(resultJson, jatos.startNextComponent);
        }
    });
});
