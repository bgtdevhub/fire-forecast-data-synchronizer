const request = require('request');
const moment = require('moment');

const client_id = '';
const client_secret = '';
const featureServerUrl = '';
const featureServerUrlApplyEdit = `${featureServerUrl}/applyEdits`;
const oauth2Url = 'https://www.arcgis.com/sharing/rest/oauth2/token/';
const sourceUrl = 'https://data.emergency.vic.gov.au/Show?pageId=getFDRTFBJSON';

const getFeatureData = (token) =>
  new Promise((resolve, reject) => {
    request(
      {
        url: `${featureServerUrl}/query?token=${token}&where=1%3D1&f=json&outFields=OBJECTID, TFB_DIST, ForecastID`,
        headers: {},
        method: 'GET',
        encoding: null
      },
      function (error, res, body) {
        if (res.statusCode == 200 && !error) {
          resolve(JSON.parse(body));
        }
        reject(error);
      }
    );
  });

const getSourceData = () =>
  new Promise((resolve, reject) => {
    request(
      {
        url: sourceUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET',
        encoding: null
      },
      function (error, res, body) {
        if (res.statusCode == 200 && !error) {
          resolve(JSON.parse(body));
        }
        reject(error);
      }
    );
  });

const applyEdit = (updateData, token) =>
  new Promise((resolve, reject) => {
    const updates = updateData.map(data => {
      return {
        attributes: {
          OBJECTID: data.objectId,
          issueFor: data.issueFor,
          FDR: data.FDR,
          TotalFireBan: data.TotalFireBan
        }
      };
    });
    console.log(`updates: ${JSON.stringify(updates)}`);

    request.post(
      {
        url: featureServerUrlApplyEdit,
        json: true,
        formData: {
          updates: JSON.stringify(updates),
          f: 'json',
          token: token
        }
      },
      function (error, response, body) {
        if (response.statusCode == 200 && !error) {
          resolve(body);
        }
        reject(error);
      }
    );
  });


const requestToken = () =>
  // generate a token with client id and client secret
  new Promise((resolve, reject) => {
    request.post(
      {
        url: oauth2Url,
        json: true,
        form: {
          f: 'json',
          client_id,
          client_secret,
          grant_type: 'client_credentials',
          expiration: '1440'
        }
      },
      function (error, response, { access_token }) {
        if (error) reject(error);

        resolve(access_token);
      }
    );
  });


const appRouter = app => {
  app.get('/', async (req, res) => {
    console.log("Synchronization started.")

    try {
      //1. Request tokens from ArcGIS online
      const token = await requestToken();

      //2. Get feature data
      const featureData = await getFeatureData(token);

      let arrUpdates = [];

      const sourcedata = await getSourceData();

      sourcedata.results.forEach((element, index) => {
        const issueForDate = moment(element.issueFor, "DD/MM/YYYY").valueOf();

        const existingUpdate = arrUpdates.find(x => x.issueFor === issueForDate);

        if (!existingUpdate)
        {
          element.declareList.forEach(declare => {
            const currentFeature = featureData.features.find(x => x.attributes.TFB_DIST.toLowerCase() === declare.name.toLowerCase() && x.attributes.ForecastID === index + 1);
            
            if (element.issueAt && !element.status) {
              arrUpdates.push({
                objectId: currentFeature.attributes.OBJECTID,
                forecastId: index + 1,
                issueFor: issueForDate,
                FDR: declare.status,
                TotalFireBan: '',
                districtName: declare.name
              })
            }
            else {
              arrUpdates.push({
                objectId: currentFeature.attributes.OBJECTID,
                forecastId: index + 1,
                issueFor: issueForDate,
                FDR: '',
                TotalFireBan: declare.status,
                districtName: declare.name
              })
            }
          });
        } else {
          element.declareList.forEach(declare => {
            const currentFeature = featureData.features.find(x => x.attributes.TFB_DIST.toLowerCase() === declare.name.toLowerCase() && x.attributes.ForecastID === existingUpdate.forecastId);
            
            const currentUpdateIndex = arrUpdates.findIndex(x => x.objectId === currentFeature.attributes.OBJECTID);

            if (element.issueAt && !element.status) {
              arrUpdates[currentUpdateIndex].FDR = declare.status;
            }
            else {
              arrUpdates[currentUpdateIndex].TotalFireBan = declare.status;
            }
          });
        }
      });
      
      const result = await applyEdit(arrUpdates, token);

      res
        .status(200)
        .send(res.body);

      return;
    } catch (e) {
      console.log(e);
    }

    console.log("Synchronization completed.")
  });
};

module.exports = appRouter;
