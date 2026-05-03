const axios = require('axios');
async function test() {
  try {
    const { data: node } = await axios.post('http://localhost:8080/api/maps/1/nodes', {
      name: 'Test Node',
      type: 'PERSON'
    }, { headers: { "Authorization": "Bearer TEST_TOKEN" }});
    console.log("Created:", node);
    const { data: updated } = await axios.put(`http://localhost:8080/api/maps/1/nodes/${node.id}`, {
      id: node.id, // simulate frontend NodeDto
      mapId: node.mapId,
      name: 'NEW NAME',
      type: 'PERSON'
    }, { headers: { "Authorization": "Bearer TEST_TOKEN" }});
    console.log("Updated:", updated);
  } catch (e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
test();
