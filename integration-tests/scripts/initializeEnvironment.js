const fetch = require('node-fetch');
const prompts = require('prompts');

const fetchOk = async (...args) => {
  const res = await fetch(...args);
  if (res.ok) {
    return res;
  }
  throw await res.text();
};

const namespace = 'gatk';
const name = 'echo_to_file';

const wdl = `task echo_to_file {
  String? input1

  output {
    String out = read_string(stdout())
  }

  command {
    echo "result: \${input1}"
  }

  runtime {
    docker: "photon"
  }
}

workflow echo_strings {
  call echo_to_file
}`;

const setupMethod = async () => {
  const { env, fcToken, googleToken } = await prompts(
    [
      {
        type: 'text',
        name: 'env',
        message: 'Environment for api calls (dsde-xxx.broadinstitute.org)',
      },
      {
        type: 'text',
        name: 'fcToken',
        message: (_, { env }) => `Bearer token for a user already registered on Terra in ${env}`,
      },
      {
        type: 'text',
        name: 'googleToken',
        message: (_, { env }) => `Bearer token for a user with access to ${env}'s firecloud-alerts bucket`,
      },
    ],
    { onCancel: () => process.exit() }
  );

  const agoraUrl = `https://agora.dsde-${env}.broadinstitute.org`;
  const rawlsUrl = `https://rawls.dsde-${env}.broadinstitute.org`;

  const agoraPublicQuery = '?user=public&roles=All';

  const fcHeaders = { Authorization: `Bearer ${fcToken}`, 'Content-Type': 'application/json' };
  const googleHeaders = { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' };

  try {
    const methodPayload = {
      namespace,
      name,
      entityType: 'Workflow',
      payload: wdl,
    };

    const { snapshotId: methodSnapshot } = await fetchOk(`${agoraUrl}/api/v1/methods`, {
      method: 'POST',
      headers: fcHeaders,
      body: JSON.stringify(methodPayload),
    }).then((res) => res.json());

    console.log(`Created method ${namespace}/${name} snapshot ${methodSnapshot}`);

    await fetchOk(`${agoraUrl}/api/v1/methods/${namespace}/${name}/${methodSnapshot}/permissions${agoraPublicQuery}`, {
      method: 'POST',
      headers: fcHeaders,
    });

    console.log('Made method public');

    const configTemplate = await fetchOk(`${rawlsUrl}/api/methodconfigs/template`, {
      method: 'POST',
      headers: fcHeaders,
      body: JSON.stringify({ methodNamespace: namespace, methodName: name, methodVersion: methodSnapshot, sourceRepo: 'agora' }),
    }).then((res) => res.json());

    const configBody = {
      namespace,
      name: `${name}-configured`,
      payload: JSON.stringify({
        ...configTemplate,
        inputs: { 'echo_strings.echo_to_file.input1': 'this.input' },
        outputs: { 'echo_strings.echo_to_file.out': 'this.output' },
        namespace,
        name: `${name}-configured`,
        rootEntityType: 'test_entity',
      }),
      entityType: 'Configuration',
    };

    const { snapshotId: configSnapshot } = await fetchOk(`${agoraUrl}/api/v1/configurations`, {
      method: 'POST',
      headers: fcHeaders,
      body: JSON.stringify(configBody),
    }).then((res) => res.json());

    console.log(`Created config ${name}-configured snapshot ${configSnapshot}`);

    await fetchOk(`${agoraUrl}/api/v1/configurations/${namespace}/${name}-configured/${configSnapshot}/permissions${agoraPublicQuery}`, {
      method: 'POST',
      headers: fcHeaders,
    });

    console.log('Made config public');

    await fetchOk(`${agoraUrl}/api/v1/methods/${namespace}/permissions${agoraPublicQuery}`, {
      method: 'POST',
      headers: fcHeaders,
    });

    await fetchOk(`${agoraUrl}/api/v1/configurations/${namespace}/permissions${agoraPublicQuery}`, {
      method: 'POST',
      headers: fcHeaders,
    });

    console.log('Made namespace public');

    const featuredMethodsUrl = `https://www.googleapis.com/storage/v1/b/firecloud-alerts-${env}/o/featured-methods.json`;

    const featuredMethods = await fetch(`${featuredMethodsUrl}?alt=media`).then((res) => res.ok && res.json());

    if (!featuredMethods || !featuredMethods.some((method) => method.name === name && method.namespace === namespace)) {
      await fetchOk(
        `https://www.googleapis.com/upload/storage/v1/b/firecloud-alerts-${env}/o?uploadType=media&name=featured-methods.json&predefinedAcl=projectPrivate`,
        {
          method: 'POST',
          headers: googleHeaders,
          body: JSON.stringify([...(!featuredMethods ? [] : featuredMethods), { namespace, name }]),
        }
      );

      await fetchOk(featuredMethodsUrl, {
        method: 'PUT',
        headers: googleHeaders,
        body: JSON.stringify({ cacheControl: 'public, max-age=0, no-store', contentType: 'application/json' }),
      });

      await fetchOk(`${featuredMethodsUrl}/acl/allUsers`, {
        method: 'PATCH',
        headers: googleHeaders,
        body: JSON.stringify({ entity: 'allUsers', role: 'READER' }),
      });
    }

    console.log('Made sure method is featured');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

setupMethod();
