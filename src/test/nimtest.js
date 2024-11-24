import axios from 'axios';

(async () => {
    let res = await axios.post('http://localhost:8000/v1/embeddings', {
        input: ["Hello world"],
        model: "nvidia/nv-embedqa-e5-v5",
        input_type: "passage"
    });
    console.log(res.data.data[0].embedding.length)

})();
