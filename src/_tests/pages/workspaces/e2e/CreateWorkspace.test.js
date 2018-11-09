const puppeteer = require('puppeteer')
const expect = require('expect-puppeteer')
const {auth} = require('google-auth-library');
const {OAuth2Client} = require('google-auth-library');
// var dockerCLI = require('docker-cli-js');
// var DockerOptions = dockerCLI.Options;
// var Docker = dockerCLI.Docker;
const {google} = require('googleapis');
let privatekey = require("./privatekey.json");



import { setDefaultOptions } from 'expect-puppeteer'
setDefaultOptions({ timeout: 5*1000 })

// const appUrlBase = 'https://bvdp-saturn-dev.appspot.com'
const appUrlBase = 'http://localhost:3000'
const user = {
	email: 'b.adm.firec@gmail.com',
	password: 'BroadDec1'
}
function wait(ms)  {
  return new Promise(resolve => setTimeout(resolve, ms))
}

  /**
   * Attach an event listener to page to capture a custom event on page load/navigation.
   * @param {string} type Event name.
   * @return {!Promise}
   */
  function listenFor(page, type) {
    return page.evaluateOnNewDocument(type => {
      document.addEventListener(type, e => {
        window.onCustomEvent({type, detail: e.detail});
      });
    }, type);
  }


async function realGoogleLogin(browser, page) {
	console.log("inside realGoogleLogin")
	// sign in    
	await page.waitForSelector('#signInButton')
	console.log("found #signInButton")
	await page.waitForSelector('#signInButton')
	await page.waitForSelector('#signInButton')
	await page.waitForSelector('#signInButton')

	// TODO: try this:
	// await expect(page).toClick('#signInButton')
	await page.hover('#signInButton') // issue: https://github.com/GoogleChrome/puppeteer/issues/1769
	await page.click('#signInButton')
	    // Node is either not visible or not an HTMLElement
      
     //  at ElementHandle._clickablePoint (node_modules/puppeteer/lib/ElementHandle.js:90:13)
     //      at <anonymous>
     //  at process._tickCallback (internal/process/next_tick.js:188:7)

	console.log("clicked on #signInButton")

	const nav = new Promise(res => browser.on('targetcreated', res))

	await nav

	const pageList = await browser.pages();
	const newPage = await pageList[pageList.length - 1];
console.log(4)


	await newPage.waitForSelector('#identifierId');
	await newPage.type('#identifierId', user.email);
  // console.log('Taking a break...');
  // await wait(1000);
  // console.log('Two second later');
	await newPage.keyboard.press('Enter');
	// await newPage.waitForSelector(`#identifierNext`);
	// await newPage.hover('#identifierNext')
	// await newPage.click('#identifierNext');
console.log(5)
  // console.log('Taking a break...');
  // await wait(1000);
  // console.log('Two second later');

	await newPage.waitForSelector('#password input[type="password"]', { visible: true });
	await newPage.type('#password input[type="password"]', user.password)
console.log(6)
  // console.log('Taking a break...');
  // await wait(1000);
  // console.log('Two second later');
console.log(7)
	// await newPage.once('close', () => console.log('Page closed!'));

	await newPage.keyboard.press('Enter')
	await page.waitForNavigation({waitUntil: 'networkidle0'});
	await wait(2*1000)

	// await wait(5*1000)


	  // browser.on('targetdestroyed', async () => console.log('Target destroyed. Pages count: ' + (await browser.pages()).length));

	// await listenFor(newPage, 'targetdestroyed')
	// await listenFor(newPage, 'targetdestroyed')
	// await listenFor(newPage, 'targetdestroyed')
	// await listenFor(newPage, 'close')
	// await newPage.once('close', () => console.log('Page closed!'));
	// await Promise.all([
	// 	// newPage.on.('close')

		
	// 	// newPage.waitForNavigation({waitUntil: 'networkidle0'}),
	// 	// wait(2000),
	// 	// page.waitForNavigation({waitUntil: 'load'}),
	// 	// page.waitForNavigation({waitUntil: 'networkidle0'}),
	// 	page.goto(appUrlBase+'/#workspaces'),
		// page.waitForNavigation({waitUntil: 'networkidle0'}),
	// ]);

	// await page.goto(appUrlBase+'/#workspaces')

console.log(8)


	// return page.waitForNavigation({waitUntil: 'networkidle0'});
}

async function serviceAccountSetup() {

	const iam = google.iam({version: 'v1', auth: 'AIzaSyB2J4T0A51odv8qp-vpTMWcuDa6I-oe0_0'})


	// serviceAccount name: 
	var accountId = 'a' + makeUniqueId()

	var jwtClient = new google.auth.JWT(
       privatekey.client_email,
       null,
       privatekey.private_key,
       ['https://www.googleapis.com/auth/cloud-platform']);
	//authenticate request
	await jwtClient.authorize(function (err, tokens) {
	 if (err) {
	   console.log(err);
	   return;
	 } else {
	   console.log("Successfully connected!");
	 }
	});

	var sa = await google.iam({version: 'v1', auth: jwtClient}).projects.serviceAccounts.create({name: 'projects/aj-saturn-tests', resource: {accountId: accountId}})
	// ya29.c.EloWBmEP_tx076-UL6W3Rfs5fla03aum94RYhN12LMPNoEXEImQ24ufgPmHtyVE8oVbM6xfm8d1nUlEuQ7RIeIeTex9nVUaj0QblTzCdqSoDcvzS3EmmooSguBU

	//ya29.c.EloWBlzBPglGh_LoMPmTIgGtpsRRxDU2Jn2nbD3ntEil-_n_ec_TIw60Fzjq2yEdvi-6Vo-JgzdjFR0i3Oup_FK6f9iOP7nr4OqEZkDlM44F3F0AkPGw9xLh9dQ

	//curl -X GET --header 'Accept: application/json' --header 'Authorization: Bearer ya29.c.EloWBmEP_tx076-UL6W3Rfs5fla03aum94RYhN12LMPNoEXEImQ24ufgPmHtyVE8oVbM6xfm8d1nUlEuQ7RIeIeTex9nVUaj0QblTzCdqSoDcvzS3EmmooSguBU' 'https://firecloud-orchestration.dsde-alpha.broadinstitute.org/me'
	//curl -X GET --header 'Accept: application/json' --header 'Authorization: Bearer ya29.c.EloWBmEP_tx076-UL6W3Rfs5fla03aum94RYhN12LMPNoEXEImQ24ufgPmHtyVE8oVbM6xfm8d1nUlEuQ7RIeIeTex9nVUaj0QblTzCdqSoDcvzS3EmmooSguBU' 'https://firecloud-orchestration.dsde-dev.broadinstitute.org/me'

	// curl -X GET --header 'Accept: application/json' --header 'Authorization: Bearer ya29.c.EloWBlzBPglGh_LoMPmTIgGtpsRRxDU2Jn2nbD3ntEil-_n_ec_TIw60Fzjq2yEdvi-6Vo-JgzdjFR0i3Oup_FK6f9iOP7nr4OqEZkDlM44F3F0AkPGw9xLh9dQ' 'https://firecloud-orchestration.dsde-alpha.broadinstitute.org/register/userinfo'



	console.log('sa is: ')
	console.log(sa)

	var privatekey = await google.iam({version: 'v1', auth: jwtClient}).projects.serviceAccounts.keys.create({name: sa.name})

	console.log(privatekey)

	return

	// the above is not an IAM --> need an iam to do the below.
	// so create a new IAM? or find another way to generate an auth token ..

	var sa = await sa._options.auth.createScoped(['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']).authorize(function (err, tokens) {
   if (err) {
     console.log(err);
     return;
   } else {
     console.log("Successfully connected!");
   }
  })


  var token = await sa._options.auth.createScoped(['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']).getAccessToken().then(res => {
      console.log(res)
      // var jres = JSON.stringify(res)
      console.log(res.token)
      return res.token
    });

  console.log(token)

}

// returns a datetime (in miliseconds) appended with with 10 random digits
// for example: "1536730875568-6223381579"
// this fits within the size limit (15-30) for Service Account IDs
function makeUniqueId() {
	let id = Date.now().toString() + '-' + Math.random().toString().substring(2,12)
	return id
}

async function servieAccountDelete() {

	// delete SA here

}

/**
 * Create a new OAuth2Client, and go through the OAuth2 content
 * workflow.  Return the full client to the callback.
 */
// function getAuthenticatedClient() {
//   return new Promise((resolve, reject) => {
//     // create an oAuth client to authorize the API call.  Secrets are kept in a `keys.json` file,
//     // which should be downloaded from the Google Developers Console.
//     const oAuth2Client = new OAuth2Client(
//       keys.web.client_id,
//       keys.web.client_secret,
//       keys.web.redirect_uris[0]
//     );

//     // Generate the url that will be used for the consent dialog.
//     const authorizeUrl = oAuth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: 'https://www.googleapis.com/auth/plus.me'
//     });

//     // Open an http server to accept the oauth callback. In this simple example, the
//     // only request to our webserver is to /oauth2callback?code=<code>
//     const server = http.createServer(async (req, res) => {
//       if (req.url.indexOf('/oauth2callback') > -1) {
//         // acquire the code from the querystring, and close the web server.
//         const qs = querystring.parse(url.parse(req.url).query);
//         console.log(`Code is ${qs.code}`);
//         res.end('Authentication successful! Please return to the console.');
//         server.close();

//         // Now that we have the code, use that to acquire tokens.
//         const r = await oAuth2Client.getToken(qs.code)
//         // Make sure to set the credentials on the OAuth2 client.
//         oAuth2Client.setCredentials(r.tokens);
//         console.info('Tokens acquired.');
//         resolve(oAuth2Client);
//       }
//   	const tokens = await oAuth2Client.getToken(code);

//     }).listen(3000, () => {
//       // open the browser to the authorize url to start the workflow
//       opn(authorizeUrl);
//     });

//   });
// }



describe('Google', () => {
	let browser
	let page
  beforeEach(async () => {
  	jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
	browser = await puppeteer.launch({
		headless: false//, 
		// slowMo: 100 // slow down by X ms // this seems to make the test skip the things in beforeEach
	});
	const context = await browser.createIncognitoBrowserContext();
	page = await context.newPage();
	await page.setViewport({
		width: 1920,
		height: 1080
	});
	page.on('console', msg => console.log('PAGE LOG:', msg.text()));

	await Promise.all([
		page.goto(appUrlBase),
		wait(1000),
		page.waitForNavigation({waitUntil: 'networkidle0'}), // this is so that it waits until the signin button appears ..  | maybe increase the timeout instead? 
	]);
	// return page.waitForNavigation({waitUntil: 'networkidle0'});

  // console.log('Taking a break...');
  // await wait(1000);
  // console.log('Two second later');


	// await newPage.waitForSelector('#passwordNext', { visible: true });
 //    await newPage.waitFor(500)
 //    await newPage.hover('#passwordNext')
	// return newPage.click('#passwordNext')
    // await page.

  })

  afterEach(async () => {
  	// if debug, wait 1 second
  	await wait(1000)
    console.log('🎉');
    await page.close();
    // return Promise.resolve();
  });


  it('hello - real google login', async function() {
  	console.log("TEST STARTING")
  // console.log('Taking a break...');
  	await realGoogleLogin(browser, page)


	// await page.waitForNavigation({waitUntil: 'load'});


  
  // console.log('Two second later');
  	console.log("TEST CONTINUING")

    // const title = await page.title();
    // await expect(title).toMatch('Saturn')
  	console.log("TEST A")
    await expect(page).toMatch('Saturn')

    // await expect(page).toMatch('Create A New Workspace')
  	console.log("TEST B")
    await expect(page).toMatch('New Workspace')
    // await wait(3000) // needs a wait here or it will fail...? maybe not --- but it will fail the next part
	// await page.waitForNavigation({waitUntil: 'networkidle2'});
    // Error
    //   Error: Text not found "Workspace name *"
    //   waiting for function failed: timeout 500ms exceeded

    

  	// return Promise.resolve();
  })


  it('hello2 - create a workspace', async () => {
  	console.log("TEST STARTING")
  // console.log('Taking a break...');
  	await realGoogleLogin(browser, page)


	// await page.waitForNavigation({waitUntil: 'load'});


  
  // console.log('Two second later');
  	console.log("TEST CONTINUING")

	// await page.waitForNavigation({waitUntil: 'networkidle0'});
    await expect(page).toMatch('New Workspace')

	await page.hover('[testid="createNewWorkspace"]')
    await page.click('[testid="createNewWorkspace"]')

	// const dialog = await expect(page).toDisplayDialog(async () => {
	// 	await expect(page).toClick('[testid="createNewWorkspace"]')
	// })
	// this hangs ^


    var workspaceName = 'TestWS-1'
    await expect(page).toMatch('Workspace name *')
    // await page.type('[placeholder="Enter a name"]', workspaceName)
    await page.type('[testid="workspaceNameInput"]', workspaceName)

 //    await page.click('.Select-arrow-zone')
 //    await page.type('#react-select-2--value', 'general-dev-billing-account')
	// await page.keyboard.press('Enter')
	expect(page).toSelect('select[]')
    
    await page.type('[placeholder="Enter a description"]', 'description for ' + workspaceName)
    await wait (1*1000)
	// await page.hover('[style="outline: 0px; outline-offset: 0px; cursor: pointer; display: inline-flex; justify-content: space-around; align-items: center; height: 2.25rem; font-weight: 500; font-size: 14px; text-transform: uppercase; white-space: nowrap; user-select: none; border-radius: 5px; color: white; padding: 0px 1.5rem; background-color: rgb(38, 145, 208);"]')
	// await page.click('[style="outline: 0px; outline-offset: 0px; cursor: pointer; display: inline-flex; justify-content: space-around; align-items: center; height: 2.25rem; font-weight: 500; font-size: 14px; text-transform: uppercase; white-space: nowrap; user-select: none; border-radius: 5px; color: white; padding: 0px 1.5rem; background-color: rgb(38, 145, 208);"]')
	await page.hover('[testid="createWorkspaceButton"]')
	await page.click('[testid="createWorkspaceButton"]')

    // Error
    //   Error: Text not found "Workspace name *"
    //   waiting for function failed: timeout 500ms exceeded

    

  	// return Promise.resolve();
  }, 50*1000) //TODO: remove this timeout. - doesn't help with the page load.

  it('hello3 - login with service account', async () => {
  	console.log("TEST STARTING")
  // console.log('Taking a break...');

  	console.log("Logging in")


	// var docker = new Docker();
	
	// docker.command('ps').then(function (data) {
 //    console.log('data = ', data);
   // })

/**
 * Start by acquiring a pre-authenticated oAuth2 client.
 */
  // try {
  //   const oAuth2Client = await getAuthenticatedClient();
  //   // Make a simple request to the Google Plus API using our pre-authenticated client. The `request()` method
  //   // takes an AxiosRequestConfig object.  Visit https://github.com/axios/axios#request-config.
  //   const url = 'https://www.googleapis.com/plus/v1/people?query=pizza';
  //   const res = await oAuth2Client.request({url})
  //   console.log(res.data);
  // } catch (e) {
  //   console.error(e);
  // }



	// await page.waitForNavigation({waitUntil: 'load'});


  
  // console.log('Two second later');
  	console.log("TEST CONTINUING")

    // const title = await page.title();
    // await expect(title).toMatch('Saturn')
    await expect(page).toMatch('Saturn')
  	console.log("TEST A")

  	console.log("TEST B")
    // await expect(page).toMatch('Create A New Workspace')
    await expect(page).toMatch('New Workspace')
    // await wait(3000) // needs a wait here or it will fail...? maybe not --- but it will fail the next part
	// await page.waitForNavigation({waitUntil: 'networkidle2'});

	// await page.hover('[shape="plus-circle"]')
 //    await page.click('[shape="plus-circle"]')

 //    await expect(page).toMatch('Workspace name *')
    // Error
    //   Error: Text not found "Workspace name *"
    //   waiting for function failed: timeout 500ms exceeded

    

  	// return Promise.resolve();
  })


})
