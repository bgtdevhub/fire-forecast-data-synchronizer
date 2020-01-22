# fire-forecast-data-synchronizer

Lambda function that synchronize Victorian Government Emergency Fire Forecast Data to ArcGIS.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### How it works?

In every xx hours, this lambda function will call an API provided by Victorian Government. This API provides the details of a single environment monitoring site with current fire ban advice for the next 5 days of data.

### Prerequisites

The app can be deploy as standalone NodeJS web app or as a AWS lambda function. To deploy to AWS Lambda, use [Serverless](https://serverless.com/)

### Installing

```
npm install
```

### Credentials and Registering your App

For this code to work, you need to
[add](https://doc.arcgis.com/en/marketplace/provider/create-listing.htm) and
[register](http://doc.arcgis.com/en/marketplace/provider/register-app.htm) an app in ArcGIS Online,
add the correct redirect URI (e.g. `http://localhost:8080`), and add the client ID and secret to [/routes/routes.js](/routes/routes.js).

- [How to add an app in ArcGIS Online](https://doc.arcgis.com/en/marketplace/provider/create-listing.htm)
- [How to register an app in ArcGIS Online](http://doc.arcgis.com/en/marketplace/provider/register-app.htm)
- Make sure to set the correct redirect URI (e.g. `http://localhost:8080`)

Finally, update [/routes/routes.js](/routes/routes.js) to contain your client ID and secret (and portal URL if not ArcGIS Online):

```javascript
const client_id = 'xx';
const client_secret = 'xx';
```

Update the feature server URL

```javascript
const featureServerUrl = 'xx';
```

Update the feature server URLs needed to update the time extent cache (optional)

```javascript
const fsUrlsForTimeExtentCacheUpdate = ['xx', 'xx'];
```

### Deploy to AWS Lambda

```
sls deploy
```

### Running the Lambda function offline

```
sls offline start
```

### Manually trigger AWS Lambda function
```
sls invoke -f app
```

## To run as a NodeJS app

Comment out the Serverless handle and uncomment the local server part in [/index.js](/index.js)

```javascript
// module.exports.handler = serverless(app);

// USE THIS FOR LOCAL SERVER
var server = app.listen(3000, function() {
  console.log('app running on port.', server.address().port);
});
```

## Authors

- **Ho Xin Jun** - _Initial work_

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
