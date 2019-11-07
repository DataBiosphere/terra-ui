const fetch = require('node-fetch')


const [env, token] = process.argv.slice(2)

const agoraUrl = `https://agora.dsde-${env}.broadinstitute.org`
const rawlsUrl = `https://rawls.dsde-${env}.broadinstitute.org`

const namespace = 'terra-integration-test'
const name = 'echo_to_file'

const wdl = `task echo_to_file {
  String? input1

  output {
    String out = read_string(stdout())
  }

  command {
    echo "result: \${input1}"
  }

  runtime {
    docker: "alpine"
  }
}

workflow echo_strings {
  call echo_to_file
}`

const standardHeaders = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

const setupMethod = async () => {
  try {
    const methodPayload = {
      namespace, name,
      entityType: 'Workflow',
      payload: wdl
    }

    const { snapshotId: methodSnapshot } = await fetch(`${agoraUrl}/api/v1/methods`, {
      method: 'POST',
      headers: standardHeaders,
      body: JSON.stringify(methodPayload)
    }).then(res => res.json())

    console.log(`Created method ${namespace}/${name} snapshot ${methodSnapshot}`)

    await fetch(`${agoraUrl}/api/v1/methods/${namespace}/${name}/${methodSnapshot}/permissions?user=public&roles=All`, {
      method: 'POST',
      headers: standardHeaders
    })

    console.log('Made method public')

    const configTemplate = await fetch(`${rawlsUrl}/api/methodconfigs/template`, {
      method: 'POST',
      headers: standardHeaders,
      body: JSON.stringify({ methodNamespace: namespace, methodName: name, methodVersion: methodSnapshot, sourceRepo: 'agora' })
    }).then(res => res.json())

    const configBody = {
      namespace, name: `${name}-configured`,
      payload: JSON.stringify({
        ...configTemplate,
        inputs: { 'echo_strings.echo_to_file.input1': 'foo' },
        outputs: { 'echo_strings.echo_to_file.out': 'this.out' },
        namespace, name: `${name}-configured`,
        rootEntityType: 'participant'
      }),
      entityType: 'Configuration'
    }

    const { snapshotId: configSnapshot } = await fetch(`${agoraUrl}/api/v1/configurations`, {
      method: 'POST',
      headers: standardHeaders,
      body: JSON.stringify(configBody)
    }).then(res => res.json())

    console.log(`Created config ${name}-configured snapshot ${configSnapshot}`)

    await fetch(`${agoraUrl}/api/v1/configurations/${namespace}/${name}-configured/${configSnapshot}/permissions?user=public&roles=All`, {
      method: 'POST',
      headers: standardHeaders
    })

    console.log('Made config public')

    await fetch(`${agoraUrl}/api/v1/methods/${namespace}/permissions?user=public&roles=All`, {
      method: 'POST',
      headers: standardHeaders
    })

    await fetch(`${agoraUrl}/api/v1/configurations/${namespace}/permissions?user=public&roles=All`, {
      method: 'POST',
      headers: standardHeaders
    })

    console.log('Made namespace public')

    // const featuredMethodsUrl = `https://www.googleapis.com/storage/v1/b/firecloud-alerts-${env}/o/featured-methods.json`
    //
    // const featuredMethods = await fetch(`${featuredMethodsUrl}?alt=media`, { headers: standardHeaders }).then(res => res.json())
    //
    // if (!featuredMethods || !featuredMethods.some(method => method.name === name && method.namespace === namespace)) {
    //   const { acl } = await fetch(`${featuredMethodsUrl}?projection=full`, { headers: standardHeaders }).then(res => res.json())
    //
    //   await fetch(`https://www.googleapis.com/upload/storage/v1/b/firecloud-alerts-${env}/o?uploadType=media&name=featured-methods.json`, {
    //     method: 'POST',
    //     headers: standardHeaders,
    //     body: JSON.stringify([...featuredMethods, { namespace, name }])
    //   }).then(res => res.json())
    //
    //   await fetch(featuredMethodsUrl, {
    //     method: 'PUT',
    //     headers: standardHeaders,
    //     body: JSON.stringify({ acl, cacheControl: 'public, max-age=0, no-store', contentType: 'application/json' })
    //   })
    // }
    //
    // console.log('Made sure method is featured')
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

setupMethod()
