'use strict';

import pluginId from "../util/pluginId";


const settingsService = ({ strapi }) => ({
	get() {
		return strapi.config.get(`plugin::${pluginId}`);
	},
});

export default settingsService;
