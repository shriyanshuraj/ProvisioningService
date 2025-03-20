import app from "./app";

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`ProvisioningService running on port ${PORT}`);
});
