const Address = require("../models/Address");

const addAddress = async (req, res) => {
  try {
    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, phone, address, city, state and pincode are required",
      });
    }

    if (isDefault === true) {
      await Address.updateMany(
        {
          user: req.user.userId,
          isActive: true,
        },
        {
          $set: { isDefault: false },
        }
      );
    }

    const address = await Address.create({
      user: req.user.userId,
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      isDefault,
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address,
    });
  } catch (error) {
    console.error("Add Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding address",
    });
  }
};

const getMyAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({
      user: req.user.userId,
      isActive: true,
    }).sort({
      isDefault: -1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: addresses.length,
      addresses,
    });
  } catch (error) {
    console.error("Get Addresses Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching addresses",
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      user: req.user.userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    const {
      label,
      fullName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = req.body;

    if (isDefault === true) {
      await Address.updateMany(
        {
          user: req.user.userId,
          _id: { $ne: id },
          isActive: true,
        },
        {
          $set: { isDefault: false },
        }
      );
    }

    if (label !== undefined) address.label = label;
    if (fullName !== undefined) address.fullName = fullName;
    if (phone !== undefined) address.phone = phone;
    if (addressLine1 !== undefined)
      address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined)
      address.addressLine2 = addressLine2;
    if (landmark !== undefined) address.landmark = landmark;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) address.pincode = pincode;
    if (country !== undefined) address.country = country;
    if (isDefault !== undefined)
      address.isDefault = isDefault;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Update Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating address",
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      user: req.user.userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    address.isActive = false;
    address.isDefault = false;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    console.error("Delete Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting address",
    });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findOne({
      _id: id,
      user: req.user.userId,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    await Address.updateMany(
      {
        user: req.user.userId,
        isActive: true,
      },
      {
        $set: { isDefault: false },
      }
    );

    address.isDefault = true;

    await address.save();

    res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      address,
    });
  } catch (error) {
    console.error("Set Default Address Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while setting default address",
    });
  }
};

module.exports = {
  addAddress,
  getMyAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};