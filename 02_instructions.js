jatos.onLoad(function() {

    console.log("starting instructions");

    /* initialise timeline array */

    var timeline = [];

    //////////////////
    /* instructions */
    //////////////////

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

    var instructions = {
        timeline: [
            {
                ...instruction_noresp,
                stimulus: "<p>We need to add some instructions</p>"
            },
            instruction_resp,
        ]
    }
    if (jatos.studySessionData["instructions_on"] === 1) {
        timeline.push(instructions);
    } else {
        timeline.push(
            {
                type: "html-keyboard-response",
                stimulus: "<p>skipping instructions</p>",
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
