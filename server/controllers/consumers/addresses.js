const Consumer = require("../../models/consumers/consumers");

const listAddresses = async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.user.id);
    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer not found." });
    }
    return res.status(200).json({ success: true, data: consumer.addresses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch addresses." });
  }
};

const addAddress = async (req, res) => {
  try {
    const { line1, city, state, postalCode } = req.body;
    if (!line1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: "Address line 1, city, state and postal code are required.",
      });
    }

    const consumer = await Consumer.findById(req.user.id);
    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer not found." });
    }

    const makeDefault = Boolean(req.body.isDefault) || consumer.addresses.length === 0;
    if (makeDefault) {
      consumer.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    consumer.addresses.push({
      label: req.body.label || "Home",
      line1,
      line2: req.body.line2 || "",
      city,
      state,
      country: req.body.country || "India",
      postalCode,
      phone: req.body.phone || "",
      isDefault: makeDefault,
    });

    await consumer.save();
    return res.status(201).json({ success: true, data: consumer.addresses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to add address." });
  }
};

const updateAddress = async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.user.id);
    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer not found." });
    }

    const address = consumer.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    const editable = ["label", "line1", "line2", "city", "state", "country", "postalCode", "phone"];
    editable.forEach((field) => {
      if (typeof req.body[field] === "string") {
        address[field] = req.body[field];
      }
    });

    if (req.body.isDefault === true) {
      consumer.addresses.forEach((entry) => {
        entry.isDefault = String(entry._id) === String(address._id);
      });
    }

    await consumer.save();
    return res.status(200).json({ success: true, data: consumer.addresses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to update address." });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.user.id);
    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer not found." });
    }

    const address = consumer.addresses.id(req.params.id);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    if (wasDefault && consumer.addresses.length > 0) {
      consumer.addresses[0].isDefault = true;
    }

    await consumer.save();
    return res.status(200).json({ success: true, data: consumer.addresses });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to delete address." });
  }
};

module.exports = { listAddresses, addAddress, updateAddress, deleteAddress };
