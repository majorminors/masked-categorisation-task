function get_demographics(timeline){

    var demographics_one = { 
        type: 'survey-text',
        questions: [
            {prompt: 'How old are you?',rows: 1, columns: 10,name: 'age',required: true},
            {prompt: 'What is your Prolific ID? If you cannot remember, write something here that I can use to identify you.',rows: 1, columns: 10,name: 'prolificID', required: true},
        ],
        button_label: ['->'],
    }
    timeline.push(demographics_one);

    var demographics_two = { 
        type: 'survey-multi-choice',
        questions: [
                {prompt: 'What is your sex?',name: 'sex',options: ["female","male","intersex","prefer not to say",],required: true},
                {prompt: 'Which is your dominant hand?',name: 'hand',options: ["left","right"],required: true}, 
                {prompt: 'Do you wear glasses or contacts?',name: 'vis',options: ["yes","no"],required: true}, 
               // {prompt: 'Do you have normal colour vision? <strong>If not, please exit the experiment now.</strong>',name: 'colvis',options: ["yes","no"],required: true}, 
        ],
        button_label: ['->'],
        on_finish: function(data) {
            var response = jsPsych.data.get().last(1).values()[0].response;
            if (response['hand'] == 'right'){
                jatos.studySessionData["handedness"] = 'right';
            } else if (response['hand'] == 'left') {
                jatos.studySessionData["handedness"] = 'left';
            }
        },
    }
    timeline.push(demographics_two);
}
