import http from 'http';

const payload = {
  "nivel": 3,
  "org0": "04",
  "org1": "44",
  "org2": "",
  "org3": "",
  "categoria": "INSTITUTO AGUASCALENTENSE DE LAS MES",
  "nombreCategoria": "ENCARGADA DE RECURSOS MATRIALES Y CONTROL PATRIMONIAL ",
  "ingresoBrutoMensual": 14462,
  "vigenciaInicio": "2025-11-17T04:40:29.534Z",
  "vigenciaFin": "2025-11-17T04:40:29.534Z"
};

const data = JSON.stringify(payload);

const options = {
  hostname: 'localhost',
  port: 4000, // Changed from 3000 to 4000 based on .env.example
  path: '/v1/categoria-puesto-org',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    // Add a dummy auth token if needed - adjust based on your auth setup
    // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
};

console.log('Testing POST /v1/categoria-puesto-org');
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('---');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  console.log('---');

  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      const parsed = JSON.parse(responseBody);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(responseBody);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
