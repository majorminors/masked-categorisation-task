jatos.onLoad(function() {
// when we put this into JATOS, we want to:
// counterbalance the response prompts
// select/randomise the categories
// alter the exemplars and exemplars per block and the number of variants (stimuli.quantity)

    console.log("initial set up");
    
    //////////////
    /* settings */
    //////////////

    // trials go: fixation_time -> stimulus_display_time -> stimulus_blank_time -> mask_time -> response_time-mask_time
    //            fixation ------> stimulus --------------> nothing -------------> mask ------> nothing --------------|

    jatos.studySessionData["fixation_time"] = 200; // ms to display fixation
    jatos.studySessionData["stimulus_display_time"] = 150; // ms to display trial
    jatos.studySessionData["stimulus_blank_time"] = 130; // ms to display blank screen after stimulus
    jatos.studySessionData["mask_time"] = 180; // ms to display mask (at start of response period)
    jatos.studySessionData["response_time"] = 2000; // max time for participant response
    jatos.studySessionData["training_correct"] = 20; // after how many correct trials should training finish?
    jatos.studySessionData["catch_trials"] = 20; // after how many trials should there be catch trials?
    jatos.studySessionData["catch_trial_time"] = 300; // how long should we display the catch trial image?
    jatos.studySessionData["catch_trial_feedback_time"] = 2000; // and how long to display feedback afterwards?
    jatos.studySessionData["maxBadCatchTrials"] = 10; // how many bad catch trials should there be?

    // this will work, but will need adjusting (for example, should we tell the participants how long the break is for?)
    jatos.studySessionData["break_trials"] = 0; // after how many trials should there be break trials?
    jatos.studySessionData["break_time"] = 0; // and for how long?

    jatos.studySessionData["keys"] = ['a','s','d','f']; // what keys if the keyboard option?
    if (jatos.studySessionData["keys"].length != jatos.studySessionData["num_categories"]) {throw 'keys and categories dont match!';}
    jatos.studySessionData["keys_other"] = ['k','l']; // what other keys if the keyboard option? (i.e. not sure, none of these)

    jatos.studySessionData["stimulus_difficulty"] = {
        valid: [1,2,3,4,5], // valid stimulus difficulties, should correspond to folder names
        default: 3, // default stim difficulty (used for first trials to establish accuracy)
        training: 5, // what stim difficulty to use during training
        min: 1, // min stimulus difficulty (to limit titration from going too far down)
        max: 5, // max stimulus difficulty (to limit titration from going too far up)
        accuracy: 50, // percentage difficulty to titrate to
        history: 4, // number of trials to check accuracy over
        adaptive: false, // true (will titrate difficulty to `accuracy`) | false (will set difficulty to `order`)
        order: [5,2,3], // will repmat whatever values you put in here if stimulus_difficulty.adaptive is true, and if the result doesn't evenly fit the amount of trials, it will add however many trials are left of the 0th element (so e.g. if [1,2,3], will repmat [1,2,3,1,2,3...] and if the result doesn't fit the number of trials, it will finish up by adding as many 1s as it needs [...1,2,3,1,1]. You can repmat here with `repeatThings(array,repetitions)`.
    };

    jatos.studySessionData["stimuli"] = {
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
    };


    // timeline on/off switches
    jatos.studySessionData["consent_on"] = 1; // if 1 well get consent, and demographics
    jatos.studySessionData["instructions_on"] = 1; // if 1, will do instructions
    jatos.studySessionData["training_on"] = 1; // if 1 will do training


    // subselect categories randomly, and apply the response conditions to them
    var selector = randomNoRepeats(jatos.studySessionData["stimuli"].labels); // quick anon function to grab items randomly with no repeats
    var newLabels = [];
    for (thisLabel = 0; thisLabel < jatos.studySessionData.num_categories; thisLabel++) {
        newLabels[thisLabel] = selector(); // run the anon function as many times as we have categories
    }
    var trainLabels = [];
    for (thisLabel = 0; thisLabel < jatos.studySessionData.num_categories; thisLabel++) {
        trainLabels[thisLabel] = selector(); // and create some training labels that will be different from our newLabels
        console.log('this while loop will continue until training and stimulus labels do not overlap---an endless loop will occur if trainLabels.count + newLabels.count > num_categories')
        while (newLabels.includes(trainLabels[thisLabel])) {
            trainLabels[thisLabel] = selector(); // do it until they don't overlap
        }
    }
    jatos.studySessionData["stimuli"].labels = newLabels;
    jatos.studySessionData["stimuli"].trainLabels = trainLabels;
    jatos.studySessionData["stimuli"].labels.sort(); // then resort to alphabetical
    // now arrange those according to our response_condition mapping
    jatos.studySessionData["stimuli"].labels = jatos.studySessionData["response_condition"].map(i => jatos.studySessionData["stimuli"].labels[i]);

    // let's get some consent!

    /* initialise timeline array */

    var timeline = [];

    // do consent stuff
    if (jatos.studySessionData["consent_on"] === 1) {
        get_consent(timeline); // do the consent function
        get_demographics(timeline); // do the demographics function
    } else {
        timeline.push(
            {
                type: "html-keyboard-response",
                stimulus: "<p>skipping consent</p>",
            },
        );
    }

    // standardise the screen size
    // after the consent stuff because it makes the survey plugin super tiny
    timeline.push(
        {
            type: 'resize',
            item_width: 8.56, // cm
            item_height: 5.398,
            prompt: "<p>Click and drag the lower right corner of the box until the box is the same size as a bank card held up to the screen.</p>",
            pixels_per_unit: 150
        },
    );


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
