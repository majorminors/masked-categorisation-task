function get_demographics(timeline){

    var demographics_one = { 
        type: 'survey-text',
        questions: [
            {prompt: '<scan>How old are you?</scan>',rows: 1, columns: 10,name: 'age',required: true},
            {prompt: '<scan>What is your Prolific ID? If you cannot remember, write something here that I can use to identify you.</scan>',rows: 1, columns: 10,name: 'prolificID', required: true},
        ],
        button_label: ['->'],
    }
    timeline.push(demographics_one);

    var demographics_two = { 
        type: 'survey-multi-choice',
        questions: [
                {prompt: '<scan >What is your sex?</scan>',name: 'sex',options: ["<span>female</span>","<span>male</span>","<span>intersex</span>","<span>prefer not to say</span>",],required: true},
                {prompt: '<scan>Which is your dominant hand?</scan>',name: 'hand',options: ["<span>left</span>","<span>right</span>"],required: true}, 
                {prompt: '<scan>Do you wear glasses or contacts?</scan>',name: 'vis',options: ["<span>yes</span>","<span>no</span>"],required: true}, 
               // {prompt: '<scan>Do you have normal colour vision? <strong>If not, please exit the experiment now.</strong></scan>',name: 'colvis',options: ["<span>yes</span>","<span>no</span>"],required: true}, 
        ],
        button_label: ['->'],
    }
    timeline.push(demographics_two);
}
