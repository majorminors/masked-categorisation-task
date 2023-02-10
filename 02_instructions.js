jatos.onLoad(function() {

    var skipInstructions = 0;

    if (skipInstructions == 1) {

        var timeline = [
            {
                type: 'html-keyboard-response',
                stimulus: '<div><p>skipping instructions</p></div>',
                choices: jsPsych.NO_KEYS,
                trial_duration: 300,
            }
        ];
        
    } else {

        console.log("starting instructions");

        // let's grab a category not in use by our exp
        var instructionLabels = jatos.studySessionData["stimuli"].trainLabels;
        var thisExemplar = 1; // we'll just select the first exemplar for all our instruction trials
        var thisDifficulty = jatos.studySessionData["stimulus_difficulty"].training; // and the training difficulty
        var variant = randomNoRepeats(Array.from({length: jatos.studySessionData["stimuli"].quantity}, (_, i) => i + 1)); // and a random variant function we can reuse
        var fixation_time = jatos.studySessionData["fixation_time"]; // ms to display fixation
        var stimulus_display_time = jatos.studySessionData["stimulus_display_time"]; // ms to display trial
        var stimulus_blank_time = jatos.studySessionData["stimulus_blank_time"]; // ms to display blank screen after stimulus
        var mask_time = jatos.studySessionData["mask_time"]; // ms to display mask (at start of response period)
        var response_time = jatos.studySessionData["response_time"]; // max time for participant response
        var trnTimeModifier = 6;

        var theseKeys = jatos.studySessionData["keys"].concat(jatos.studySessionData["keys_other"]);
        var thisPrompt = '<p>';
        for (promptIdx = 0; promptIdx < jatos.studySessionData["keys"].length; promptIdx++) {
           thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys"][promptIdx])+': '+JSON.stringify(instructionLabels[promptIdx]);
            if (promptIdx < jatos.studySessionData["keys"].length-1){
                thisPrompt = thisPrompt+'<span style="display: inline-block; margin-left: 40px;"></span>';
            }
        }
        thisPrompt = thisPrompt+'<br><br>';
        thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys_other"][0])+': not sure ';
        thisPrompt = thisPrompt+'<span style="display: inline-block; margin-left: 40px;"></span>';
        thisPrompt = thisPrompt+JSON.stringify(jatos.studySessionData["keys_other"][1])+': none of these</p>';


        // preload paths
        preloadPaths = [];
        instructionLabels.forEach((thisCategory) => { // for the categories we're using
            preloadPaths.push(stimulusPathFactory(thisCategory, thisExemplar, null, null, 'mask'));
            for (variantNum=1; variantNum < jatos.studySessionData["stimuli"].quantity; variantNum++){ // for the variants we have
                preloadPaths.push(stimulusPathFactory(thisCategory, thisExemplar, variantNum, thisDifficulty, 'stimulus'));
            }
        });

        /* initialise timeline array */

        var timeline = [];

        timeline.push(
            {
                type: 'preload',
                images: preloadPaths,
            },
        );

        //////////////////
        /* instructions */
        //////////////////

        var fixation = {
            type: 'html-keyboard-response',
            stimulus: '<div style="height: 250px"><p style="font-size: 48px;">+</p></div>',
            choices: jsPsych.NO_KEYS,
            trial_duration: fixation_time,
        };

        var stimulus_presentation = {
            type: 'image-keyboard-response',
            stimulus_height: 500,
            choices: jsPsych.NO_KEYS,
            margin_vertical: 4,
            prompt: thisPrompt,
            // specify these later
            // stimulus:,
            // stimulus_duration:,
            // trial_duration:,
        };

        var random_mask = {
            type: 'image-keyboard-response',
            stimulus_height: 500,
            choices: jsPsych.NO_KEYS,
            margin_vertical: 4,
            prompt: thisPrompt,
            // specify these later
            // stimulus:,
            // stimulus_duration:,
            // trial_duration:,
        };

        var instruction_noresp = {
            type: 'html-keyboard-response',
            choices: jsPsych.NO_KEYS,
            trial_duration: 1000,
            response_ends_trial: false
        }
        var instruction_resp = { // requires html stimulus entry in previous trial
            type: 'html-keyboard-response',
            stimulus: function() {
                var last_stim = jsPsych.data.get().last(1).values()[0].stimulus;
                var addcontinue = last_stim+'<p style="position: fixed; bottom: 0; left: 50%; transform: translate(-50%, -50%); margin: 0 auto;"><br>Press any key to continue</p>';
                return addcontinue;
            }
        }

        var catch_trial = [
                {
                    type: 'image-keyboard-response',
                    choices: [theseKeys[0],theseKeys[1]],
                    prompt: '<p>'+JSON.stringify(theseKeys[0])+': yes '+JSON.stringify(theseKeys[1])+': no</p>',
                    margin_vertical: 4,
                    stimulus: 'stimuli/catch-trial.png', // we need to create this
                    stimulus_height: 500,
                    stimulus_duration: jatos.studySessionData["catch_trial_time"],
                    trial_duration: jatos.studySessionData["response_time"],
                    data: {experiment_part: 'catchTrial'} // we can use this information to filter trials
                },
                {
                    type: "html-keyboard-response",
                    stimulus: function() {
                        var response = jsPsych.data.get().last(1).values()[0].response;
                        if (response != 1) { // we assume yes inserted second, so it will be 1 as javascript starts at 0 when counting
                            return '<p>incorrect<br>'
                                +'<br>Please pay attention or we will not be able to continue!</p>';
                        } else { // else if false
                            return "<p>correct!<br>thanks for paying attention.</p>";
                        }
                    },
                    choices: jsPsych.NO_KEYS,
                    trial_duration: jatos.studySessionData["catch_trial_feedback_time"],
                    data: {experiment_part: 'catchTrial-feedback'}
                }
        ];

        var instructions = {
            timeline: [
                {
                    ...instruction_noresp,
                    stimulus: "<p>Placeholder text welcoming to experiment etc.</p>"
                },
                instruction_resp,
                {
                    ...instruction_noresp,
                    stimulus: "<p>First you'll see an image, followed by a fuzzy version of the image.<br>Let me show you an example.</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[0], thisExemplar, null, null, 'prompt')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[0], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: mask_time,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>You have to identify what the image is by pressing the keys indicated at the bottom of the image.<br>Let's try that last image again now.</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[0], thisExemplar, null, null, 'prompt')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[0], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time*2,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[0])+" which is key "+JSON.stringify(theseKeys[0])+".<br>Let's do another.</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, null, null, 'prompt')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time*2,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[1])+" which is key "+JSON.stringify(theseKeys[1])+".</p>"
                },
                instruction_resp,
                {
                    ...instruction_noresp,
                    stimulus: "<p>The images will be easier or harder to see. Here's some examples of what I mean.</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[2], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[2], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time*2,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[2])+" which is key "+JSON.stringify(theseKeys[2])+".</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[2], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[2], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time*2,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[2])+" which is key "+JSON.stringify(theseKeys[2])+".</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[0], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[0], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time*2,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[0])+" which is key "+JSON.stringify(theseKeys[0])+".</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time*2,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[1])+" which is key "+JSON.stringify(theseKeys[1])+".</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[3], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time*trnTimeModifier,
                    trial_duration: stimulus_display_time+stimulus_blank_time*trnTimeModifier,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[3], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time*2,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[3])+" which is key "+JSON.stringify(theseKeys[3])+".</p>"
                },
                instruction_resp,
                {
                    ...instruction_noresp,
                    stimulus: "<p>Also, the images are actually presented much more quickly.<br>This is how fast it really goes.</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time,
                    trial_duration: stimulus_display_time+stimulus_blank_time,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[1])+" which is key "+JSON.stringify(theseKeys[1])+".</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[2], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time,
                    trial_duration: stimulus_display_time+stimulus_blank_time,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[2], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[2])+" which is key "+JSON.stringify(theseKeys[2])+".</p>"
                },
                instruction_resp,
                fixation,
                {
                   ...stimulus_presentation, 
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, variant(), 5, 'stimulus')},
                    stimulus_duration: stimulus_display_time,
                    trial_duration: stimulus_display_time+stimulus_blank_time,
                },
                {
                    ...random_mask,
                    stimulus: function(){return stimulusPathFactory(instructionLabels[1], thisExemplar, null, null, 'mask')},
                    stimulus_duration: mask_time,
                    trial_duration: response_time,
                },
                {
                    ...instruction_noresp,
                    stimulus: "<p>The correct answer there was "+JSON.stringify(instructionLabels[1])+" which is key "+JSON.stringify(theseKeys[1])+".</p>"
                },
                instruction_resp,
                {
                    ...instruction_noresp,
                    stimulus: "<p>Lastly, there will be attention checks occasionally. Let me show you what they look like.</p>"
                },
                instruction_resp,
                ...catch_trial,
                {
                    ...instruction_noresp,
                    stimulus: "<p>You can't miss or get wrong more than"+JSON.stringify(jatos.studySessionData["maxBadCatchTrials"])+" of these, or the experiment will end!<br>So please do pay attention.</p>"
                },
                instruction_resp,
                {
                    ...instruction_noresp,
                    stimulus: "<p>That's it! See the image, then use the keyboard to tell me what you saw.<br>Please answer as fast as you can, but also try to be as accurate as you can.<br>Let's practice a bit!</p>"
                },
                instruction_resp,
            ]
        }
        if (jatos.studySessionData["instructions_on"] == 1) {
            timeline.push(instructions);
        } else {
            timeline.push(
                {
                    type: "html-keyboard-response",
                    stimulus: "<p>skipping instructions</p>",
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
            });
            var thisSessionData = jatos.studySessionData;
            var thisExpData = JSON.parse(jsPsych.data.get().json());
            var resultJson = {...thisSessionData, ...thisExpData};
            jatos.submitResultData(resultJson, jatos.startNextComponent);
        }
    });
});
