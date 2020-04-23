// curblrizes a geojson output from sharedstreets-js
let jsonOutput=false;
if(process.argv[2]==="json"){
    jsonOutput=true;
}

function debug(...param){
    if(!jsonOutput){
        console.log(...param);
    }
}

const fs = require('fs');

const rpaCodeJson = fs.readFileSync('data/signalisation-codification-rpa.json');
const rpaCodes = JSON.parse(rpaCodeJson);

const overide = {2348: [{priority:4,rule:{activity:"no parking"}, timeSpans:[], userClasses:[{classes:["truck"]}]}],
                13810: [{priority:3,rule:{activity:"no parking"}, timeSpans:[{"effectiveDates":[{"from":"04-01","to":"12-01"}],"daysOfWeek":{"days":["mo","th"]},"timesOfDay":[{"from":"09:00","to":"12:00"}]}], userClasses:[{classes:["truck"]}]}]
                }

for (var rpaCode of rpaCodes) {
    if(overide[rpaCode.PANNEAU_ID_RPA]){
        rpaCode['regulations'] = [{
            priority: 5,
            rule:{
                activity: "parking"
            },
            timeSpans: []
        },...overide[rpaCode.PANNEAU_ID_RPA]
        ];
        continue;
    }

    description = rpaCode.DESCRIPTION_RPA.toUpperCase();
    let activity = '';

    if(description.includes("\\P ")) {
        activity = 'no parking';
    } else if(description.includes("\\A ")) {
        activity = 'no standing';
    } else if(description.startsWith("P ")) {
        activity = 'parking';
    } else {
        continue;
        //debug(`${rpaCode.CODE_RPA} ${description}`)
    }

    let timeSpans = [];
    let timeSpan = {};

    //   ********** months

    monthValues = { "1 MARS AU 1 DEC":[{"from":"03-01","to":"12-01"}],
                    "1ER MARS 1ER DEC":[{"from":"03-01","to":"12-01"}],
                    "1ER MARS - 1ER DÉC":[{"from":"03-01","to":"12-01"}],
                    "1ER MARS - 1ER  DÉC":[{"from":"03-01","to":"12-01"}],
                    "1ER MARS AU 1ER DECEMBRE":[{"from":"03-01","to":"12-01"}],
                    "1ER MARS AU 1ER DEC":[{"from":"03-01","to":"12-01"}],
                    "MARS 01 A DEC. 01":[{"from":"03-01","to":"12-01"}],
                    "1 MARSL AU 1 DEC":[{"from":"03-01","to":"12-01"}],
                    "1MARS AU 1 DEC.":[{"from":"03-01","to":"12-01"}],
                    "15 MARS AU 15 NOVEMBRE":[{"from":"03-15","to":"11-15"}],
                    "1 AVRIL AU 30 SEPT":[{"from":"04-01","to":"09-30"}],
                    "1 AVRIL AU 1 NOVEMBRE":[{"from":"05-01","to":"11-01"}],
                    "1 AVRIL AU 15 NOVEMBRE":[{"from":"05-01","to":"11-15"}],
                    "1 AVRIL AU 30 NOV":[{"from":"04-01","to":"11-30"}],
                    "1ER AVRIL - 30 NOV":[{"from":"04-01","to":"11-30"}],
                    "1 AVRIL AU 1 DEC":[{"from":"04-01","to":"12-01"}],
                    "1 AVIL AU 1 DEC":[{"from":"04-01","to":"12-01"}],
                    "1 AVRIL ET 1 DEC":[{"from":"04-01","to":"12-01"}],
                    "1AVRIL AU 1 DEC":[{"from":"04-01","to":"12-01"}],
                    "1AVRIL AU 1DEC":[{"from":"04-01","to":"12-01"}],
                    "1ER AVRIL AU 1ER DEC":[{"from":"04-01","to":"12-01"}],
                    "AVRIL 01 A DEC. 01":[{"from":"04-01","to":"12-01"}],
                    "1 AVRILS AU 1 DEC":[{"from":"04-01","to":"12-01"}],
                    "1 AVRIL  AU 1 DEC":[{"from":"04-01","to":"12-01"}],
                    "15 AVRIL AU 15 OCTOBRE":[{"from":"04-15","to":"10-15"}],
                    "15 AVRIL AU 1ER NOV.":[{"from":"04-15","to":"11-01"}],
                    "15 AVRIL AU 1 NOVEMBRE":[{"from":"04-15","to":"11-01"}],
                    "15 AVRIL AU 15 NOVEMBRE":[{"from":"04-15","to":"11-15"}],
                    "1MAI AU 1 SEPT":[{"from":"05-01","to":"09-01"}],
                    "1MAI AU 1OCT":[{"from":"05-01","to":"10-01"}],
                    "21 JUIN AU 1 SEPT":[{"from":"06-21","to":"09-01"}],
                    "30 JUIN AU 30 AOUT":[{"from":"06-30","to":"08-30"}],
                    "1 SEPT. AU 23 JUIN":[{"from":"09-01","to":"06-23"}],
                    "SEPT A JUIN":[{"from":"09-01","to":"06-30"}],
                    "SEPT. A JUIN":[{"from":"09-01","to":"06-30"}],
                    "1 NOV. AU 1 AVRIL":[{"from":"11-01","to":"04-01"}],
                    "16 NOV. AU 14 MARS":[{"from":"11-16","to":"03-14"}],
                    "30 NOV - 1ER AVRIL":[{"from":"11-30","to":"04-01"}],
                    "1ER DECEMBRE AU 1ER MARS":[{"from":"12-01","to":"03-01"}]}
                    
    months = Object.entries(monthValues).reduce((ret,val)=>description.includes(val[0])?val[1]:ret,null)
    if(months){
        timeSpan["effectiveDates"] = months;
    }

    if(/.*(JAN|FEV|AVR|MARS|JUI|AOUT|SEP|OCT|NOV|DEC).*/.exec(description) && !months){
        console.error("months rules unknown",rpaCode.CODE_RPA, description);
    }

    //   ********** days
    days = [];
    dayValues = { "mo":["LUNDI","LUN\\.","LUN"],
                    "tu":["MARDI","MAR\\.","MAR"],
                    "we":["MERCREDI","MER\\.","MER"],
                    "th":["JEUDI","JEU\\.","JEU"], 
                    "fr":["VENDREDI","VEN\\.","VEN","VEMDREDI"], 
                    "sa":["SAMEDI","SAM\\.","SAM"], 
                    'su':["DIMANCHE","DIM\\.","DIM"]}
    dayMap = Object.entries(dayValues).reduce((acc,val)=>{
        const [key, value] = val;
        value.forEach(val2=>acc[val2.replace("\\","")]=key);
        return acc;
    },{})
    dayText = Object.values(dayValues).flat().join('|')
    
    threeDaysRegex = new RegExp(`(${dayText})\\s(${dayText})\\s(${dayText})`);
    threeDaysRule=threeDaysRegex.exec(description);
    
    if(threeDaysRule){
        days.push(dayMap[threeDaysRule[1]]);
        days.push(dayMap[threeDaysRule[2]]);
        days.push(dayMap[threeDaysRule[3]]);

    } else {
        daysRegex  = new RegExp(`(${dayText})(\\s?\\S*\\s)(${dayText})`);
        daysRule=daysRegex.exec(description);

        if(daysRule){
            if(/.*(A|À|AU).*/.exec(daysRule[2])){
                daysAbbr=Object.keys(dayValues);
                
                days=daysAbbr.slice(daysAbbr.findIndex(val=>val===dayMap[daysRule[1]]),daysAbbr.findIndex(val=>val===dayMap[daysRule[3]])+1)
            } else if(/(ET|\s)/.exec(daysRule[2])){
                days.push(dayMap[daysRule[1]]);
                days.push(dayMap[daysRule[3]]);
            } else {
                console.error("day rules verbe unknown",daysRule[2], rpaCode.CODE_RPA, description);
            }
        } else {
            dayRegex  = new RegExp(`(${dayText})`);
            dayRule=dayRegex.exec(description);
            if(dayRule){
                days.push(dayMap[dayRule[1]]);
            }
        }
    }
    if(days.length){
        timeSpan["daysOfWeek"] = {days};
    }
    

    //   ********** time
    timeRegexp=/(\d+[H]\d*)\s?[Aaà@-]\s?(\d+[H]\d*)/g;

    if(time = timeRegexp.exec(description)){
        do{
            const convertHtime = (time) => {
                [h,m] = time.split("H")
                if(!m){
                    m="00"
                }
                return `${h.padStart(2,'0')}:${m}`
            }
            if(time){
                startTime = convertHtime(time[1]);
                endTime = convertHtime(time[2]);
                //debug(`${startTime}-${endTime} ${description}`)
            }else{
                //debug(`${description}`)
            }

            if(startTime && endTime) {
                timeSpan['timesOfDay'] = [{
                    from: startTime,
                    to: endTime
                }]
            }

            if(Object.keys(timeSpan).length){
                timeSpans.push({...timeSpan});
            }
        } while(time = timeRegexp.exec(description))
    } else {
        if(Object.keys(timeSpan).length){
            timeSpans.push({...timeSpan});
        }
    }

    let priority = timeSpan?3:4;
    
    rpaCode['regulations'] = [{
        priority: 5,
        rule:{
            activity: "parking"
        },
        timeSpans: []
    },{
        priority,
        rule:{
            activity
        },
        timeSpans
    }];
    debug(`${rpaCode.CODE_RPA.padEnd(11)} ${description.padEnd(55)} ${daysRule||dayRule} ${JSON.stringify(timeSpans)}`)
}
if(jsonOutput){
    console.log(JSON.stringify(rpaCodes, null, 2))
}

