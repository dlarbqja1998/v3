export type HomeInitialPanel = 'cafeteria' | 'shuttle' | 'pin' | 'place' | 'event' | 'facility' | null;

export type HomeLoadPolicy = {
	initialPanel: HomeInitialPanel;
	needsCafeteriaMenu: boolean;
	needsCafeteriaFeedback: boolean;
	shouldSyncCafeteriaMenu: boolean;
};

export function getHomeLoadPolicy(panel: string | null): HomeLoadPolicy {
	const initialPanel = normalizePanel(panel);
	const needsCafeteria = initialPanel === 'cafeteria';

	return {
		initialPanel,
		needsCafeteriaMenu: needsCafeteria,
		needsCafeteriaFeedback: needsCafeteria,
		shouldSyncCafeteriaMenu: needsCafeteria
	};
}

function normalizePanel(panel: string | null): HomeInitialPanel {
	if (
		panel === 'cafeteria' ||
		panel === 'shuttle' ||
		panel === 'pin' ||
		panel === 'place' ||
		panel === 'event' ||
		panel === 'facility'
	) {
		return panel;
	}

	return null;
}
