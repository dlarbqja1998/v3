export type HomeInitialPanel = 'cafeteria' | 'shuttle' | 'pin' | 'place' | null;

export type HomeLoadPolicy = {
	initialPanel: HomeInitialPanel;
	needsCafeteriaMenu: boolean;
	needsCafeteriaFeedback: boolean;
	shouldSyncCafeteriaMenu: boolean;
};

export function getHomeLoadPolicy(panel: string | null): HomeLoadPolicy {
	const initialPanel = normalizePanel(panel);
	const needsCafeteria = initialPanel === null || initialPanel === 'cafeteria';

	return {
		initialPanel,
		needsCafeteriaMenu: needsCafeteria,
		needsCafeteriaFeedback: needsCafeteria,
		shouldSyncCafeteriaMenu: needsCafeteria
	};
}

function normalizePanel(panel: string | null): HomeInitialPanel {
	if (panel === 'cafeteria' || panel === 'shuttle' || panel === 'pin' || panel === 'place') {
		return panel;
	}

	return null;
}
