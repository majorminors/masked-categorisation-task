function get_consent(timeline){


//prep instructions
var info = {
    type: 'instructions',
    pages: ["<p><strong>Understanding attention in complex tasks</strong></p>\
    <p>Principal Investigator: Alexandra Woolgar<br>\
    Researcher: ???<br>\
    PRE/NRES Code: PRE.2018.101</p>\
    <p><i>This study is part of a bigger project, 'Neuroimaging investigation of brain mechanisms of attention and cognitive control', run by our lab at the MRC Cognition and Brain Sciences Unit in Cambridge.</i></p>\
    <p>You are being invited to take part in a research study. Before you decide whether or not to participate it is important that you understand why the research is being done, what it will involve and how the information collected from you is stored and used. Please take time to read the following information carefully and discuss it with others if you wish. Ask us if there is anything that is not clear or if you would like more information. Take time to decide whether or not you wish to take part.</p>",

    "<p><strong>What is the purpose of the study?</strong><br>\
    The aim of this study is to better understand how the brain supports us to perceive, pay attention to, and respond to the world around us.</p>\
    <p><strong>Who is organising and sponsoring this research?</strong><br>\
    Cambridge University is the sponsor for this study based in the United Kingdom.</p>\
    <p><strong>Has the study been approved?</strong><br>\
    This study has been reviewed and approved by an independent group of people, Cambridge Psychology Research Ethics Committee (CPREC), who have a duty to protect research volunteers’ safety, rights, wellbeing and dignity.</p>",

    "<p><strong>Why have I been invited to take part?</strong><br>\
    You have been asked to participate because you responded to an advertisement.</p>\
    <p><strong>Do I have to take part?</strong><br>\
    It is up to you whether or not to take part. Before deciding you should read this information sheet and ask about anything that is not clear. If you decide to take part we will ask you to indicate that you have agreed to take part by clicking to continue. However, even after you have clicked to continue you can withdraw from the study without having to give us a reason.\
    You should be aware, however, that we keep results anonymous to protect your privacy. If you decide to withdraw some time after your participation it may therefore not be possible to identify and remove your specific results.</p>",

    "<p><strong>What will I be asked to do in the study?</strong><br>\
    Taking part requires you to complete a computerised task online from wherever suits you.\
    We will explain the task in detail before you start and you will have the opportunity to practice it.</p>\
    <p> <strong>Will video or audio recordings be made?</strong><br>\
    The study does not involve video or audio recording.</p>\
    <p><strong>Will I be paid for taking part?</strong><br>\
    To thank you for your contribution to this study we will give you £6 for each hour.</p>",

    "<p><strong>What are the possible risks/side effects of taking part?</strong><br>\
    There are no obvious risks from the computer task that you will be asked to complete. For online studies, we will include regular opportunities for breaks. Remember, you can withdraw from the study at any time without needing to give us a reason.</p>\
    <p><strong>What happens to my anonymised research data?</strong><br>\
    Anonymised research data includes information like the buttons you pushed on a computer task or your answers on a questionnaire; in other words, information from which it would not be possible, or would be very difficult, to identify you personally. \
    Your anonymised research data, typically combined with similar information from other volunteers, will be used for scientific research. The results are presented in scientific papers and talks, in teaching and in explaining our science to health professionals, school groups and the public in general. We take great care to ensure that individuals cannot be identified from our research outputs.</p>",

    "<p><strong>What happens to my anonymised research data (cont.)</strong><br>\
    Undertaking scientific studies is expensive and relies on the generous contribution of time from volunteers. To make the most of your anonymised research data we plan to look after it for the long term and may use it to answer research questions beyond those for which it was originally collected.</p>\
    <p>In addition to our own analyses, we agree with the principle that research data, often collected with public money, are a public good, produced in the public interest, which should be made openly available with as few restrictions as possible in a timely and responsible manner. Many of the bodies that fund our research insist that we follow this principle. In line with this we may also share anonymised research data with other researchers in the UK and around the world and may make anonymised research data available as “Open Data”. Open data can be downloaded free of charge by anyone interested in the research or who wishes to repeat or conduct new analyses. This allows others to check our results and helps avoid research duplication. If research data are made open we have no control over how that information is used.</p>\
    <p>We are very aware that, sometimes, anonymised research data could be used to identify an individual (for example, questionnaire responses about life events could identify a particular person to someone who knows him or her or who had read a newspaper story of similar events). In such cases we take great care to reduce the chances of this individual being identified by omitting critical details or not sharing even anonymised data with anyone outside of the original research team.</p>",

    "<p><strong>Can I get access to my results from the study?</strong><br>\
    It is important that, as researchers, we minimise potential harm to volunteers in our studies. We often use new techniques and interpreting research data can be complicated and has the potential to cause undue concern. For this reason we do not divulge individual results. If you have concerns about your performance please discuss these with the researcher.</p>\
    <p><strong>Are there compensation arrangements if something goes wrong?</strong><br>\
    The study has insurance to deal with any claim in the very unlikely event of anything going wrong that causes harm.</p>\
    <p><strong>What should I do if I have a complaint about the study?</strong><br>\
    We are keen that volunteers feel informed and well treated when they take part in our research. If you have a complaint about this study please contact the Principle Investigator listed at the end of this information sheet in the first instance. If you are not happy with the response, please contact the Director of the Cognition and Brain Sciences Unit (director@mrc-cbu.cam.ac.uk). Further steps can be taken through the University of Cambridge if necessary.</p>\
    <p>Thank you for considering taking part in this study. Our research depends entirely on the goodwill of potential volunteers such as you.  If you require any further information, we will be pleased to help you in any way we can.</p>\
    <p>If you require more information, please contact:</p>\
    <p>Dr Alexandra Woolgar<br>\
    MRC Cognition & Brain Sciences Unit<br>\
    15 Chaucer Road, Cambridge. CB2 7EF Tel: 01223 767704<br>\
    Email: Alexandra.woolgar@mrc-cbu.cam.ac.uk"
    ], 

    show_clickable_nav: true,
    button_label_next: ['-'],
    button_label_previous: ['-'],
};

/*
var info = {
    type: 'image-button-response',
    on_load: function(){
        document.body.style.backgroundColor="#00AAFF";
    },
    stimulus: 'img/1_PIS_1.png', //the image
    stimulus_width: 500, //px. screens have to be this wide before ppl can start
    maintain_aspect_ratio: true, 
    choices: ['->'], 
    //button_html: '<button class=jspsych-btn-light-page>%choice%</button>',
}
*/

timeline.push(info);

var consent = { 
    type: 'instructions',

    pages: ["<p><strong>Agreement to participate in this study</strong></p>\
    <p>I have read and understood the information provided to me.<br>\
    I understand that my participation is voluntary and that I am free to withdraw at any time without giving a reason.<br>\
    I understand that my data may be made available anonymously to other researchers, both inside and outside of the MRC Cognition and Brain Sciences Unit.</p>\
    <p>By clicking to take part, I agree that I have read and am confirming the above statements, and I agree to take part.</p>"], 

    show_clickable_nav: true,
    button_label_next: ['-'],
    button_label_previous: ['-'],
}

timeline.push(consent);

}
