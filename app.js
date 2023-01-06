var express = require("express");

var bodyParser = require('body-parser');
var app = express();
var ejs = require('ejs');
app.set('view engine', 'ejs');
var axios = require('axios');
app.use(express.static(__dirname + '/views'));
app.use('/assets', express.static('static'));
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json())

var baseurl = 'http://local.test:8000/api/v1/projects/';
// var baseurl = 'https://www.geodesignhub.com/api/v1/projects/';

function getSystemName(systemsResponse, diagramSystem){
    let systemName = '';
    for (let index = 0; index < systemsResponse.length; index++) {
        const currentSystem = systemsResponse[index];

        if (currentSystem.id == diagramSystem){
            systemName = currentSystem.sysname;
            break;
        }
        
    }
    return systemName
}

app.post('/update', function(request, response) {

    var tags_diagrams = request.body.tags_diagrams;

    var api_token = request.query.api_token;
    var project_id = request.query.project_id;

    response.render('success', {
        
        "api_token": api_token,
        "project_id": project_id
    });
 
 });

app.get('/', function (request, response) {

    if (request.query.apitoken && request.query.projectid) {

        var api_token = request.query.apitoken;
        var project_id = request.query.projectid;

        var cred = "Token " + api_token;

        var systems = baseurl + project_id + '/systems/';
        var diagrams = baseurl + project_id + '/diagrams/';
        var tags = baseurl + project_id + '/tags/';

        var URLS = [systems, diagrams, tags];
        let axios_instance = axios.create({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': cred
            }
        });
        const systemsRequest = axios_instance.get(systems);
        const diagramsRequest = axios_instance.get(diagrams);
        const tagsRequest = axios_instance.get(tags);

        axios.all([systemsRequest, diagramsRequest, tagsRequest]).then(axios.spread((...responses) => {
            let  systemsResponse =[];
            let  diagramsResponse =[];
            let  tagsResponse =[];
            if (responses[0].status == 200){
             systemsResponse = responses[0].data;
            }
            if (responses[1].status == 200){
                diagramsResponse = responses[1].data;
            }
            if (responses[2].status == 200){
                tagsResponse = responses[2].data;
            }
            let allDiagramDetails = [];
            for (let index = 0; index < diagramsResponse.length; index++) {
                const currentDiagram = diagramsResponse[index];
                const diagramSystem = currentDiagram.sysid;
                const sysName = getSystemName(systemsResponse, diagramSystem);
                currentDiagram['system_name'] = sysName;
                allDiagramDetails.push(currentDiagram);
                
            }
            allDiagramDetails.sort((a,b) => a.sysid - b.sysid); // b - a for reverse sort

            
            response.render('index', {
                "status": 1,
                "data": [systemsResponse, allDiagramDetails, tagsResponse],
                "api_token": api_token,
                "project_id": project_id
            });
            // use/access the results 
        })).catch(errors => {
            // react on errors.

            if (errors) return response.sendStatus(500);
        })




    } else {
        response.status(400).send('Not all parameters supplied.');

    };
});


app.listen(process.env.PORT || 5001);