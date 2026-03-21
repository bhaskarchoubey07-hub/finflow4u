const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "P2P Lending Platform API",
      version: "1.0.0",
      description: "Marketplace-based peer-to-peer lending platform API"
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    }
  },
  apis: ["./src/routes/*.js"]
};

module.exports = swaggerJSDoc(options);
