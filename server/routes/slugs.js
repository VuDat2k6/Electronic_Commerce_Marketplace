const express = require("express");

const router = express.Router();

const { getProductBySlug, getProductsBySlugs } = require("../controllers/slugs");

// Bulk lookup must come before /:slug to avoid matching "bulk" as a slug
router.route("/bulk").get(getProductsBySlugs);
router.route("/:slug").get(getProductBySlug);

module.exports = router;