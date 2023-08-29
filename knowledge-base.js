$(document).ready(function () {
	$('select').niceSelect();
});

const BACKEND_URL = 'https://beta-backend-7ikj4ovbfa-uc.a.run.app/api/v1';

// Support functions
function activateDocButtons(docs, descriptions) {
	$('.org-button').click(function () {
		const urlParams = new URLSearchParams(window.location.search);
		const org_id = urlParams.get('org_id');
		window.location.href = `/org?org_id=${org_id}`;
	});

	$('.doc-button').click(async function () {
		// Remove temporary buttons
		$('.temp').remove();

		$(this).addClass('selected').siblings().removeClass('selected');

		const doc_index = parseInt($(this).attr('id'));

		doc = docs.find((doc) => doc.activity_description_index === doc_index);

		$('#dashboard-placeholder').hide();
		$('#doc-form-wrapper').fadeIn();

		// Populate descriptions
		$('.list:first').empty();

		for (let i = 0; i < descriptions.length; i++) {
			// Append if the current index is not in the docs array
			if (!docs.find((doc) => doc.activity_description_index === i)) {
				$('.list:first').append(
					`<li data-value="${i}" class="option description truncate">${descriptions[i].pt}</li>`
				);
			}
		}

		// Append selected option
		$('.list:first').append(
			`<li data-value="${
				doc.activity_description_index
			}" class="option description truncate selected">${
				descriptions[doc.activity_description_index].pt
			}</li>`
		);

		// Update the selected option
		const option = descriptions[doc.activity_description_index].pt;
		$('.current:first').text(option);

		// Set the option value
		$('li.option.description').click(function () {
			const value = $(this).attr('data-value');
			$('#description-index').val(value);
		});

		// Populate form
		$('#doc-description').val(doc.description);

		// Check if doc.content is a text
		if (doc.content.category !== 'text') {
			$('.text-block').css('display', 'none');
			$('.appointment-block').css('display', 'block');
			$('#appointment-content').val(doc.content.link);
		} else {
			$('.text-block').css('display', 'block');
			$('.appointment-block').css('display', 'none');
			$('#text-content').val(doc.content.raw);
		}
	});
}

function resetDocs(docs, descriptions, docs_list_id = 'produts') {
	let empty_text = 'Nenhum produto cadastrado';
	$('#save-doc').val('Salvar conteúdo');
	$('#doc-form-wrapper').hide();
	$('#dashboard-placeholder').css('display', 'flex');
	$('#doc-form').trigger('reset');
	$('#doc-list').empty();
	$('#doc-list').hide();

	// Filter products (activity_description_index = 0)
	if (docs_list_id === 'produts') {
		docs = docs.filter((doc) => doc.activity_description_index === 0);
		empty_text = 'Nenhum produto cadastrado';
	}

	// Filter services (activity_description_index = 1)
	if (docs_list_id === 'services') {
		docs = docs.filter((doc) => doc.activity_description_index === 1);
		empty_text = 'Nenhum serviço cadastrado';
	}

	// Filter others (activity_description_index > 1)
	if (docs_list_id === 'others') {
		docs = docs.filter((doc) => doc.activity_description_index > 1);
		empty_text = 'Nenhum conteúdo cadastrado';
	}

	if (docs.length <= 1) {
		$('#doc-list').append(`<div class="doc-button disabled temp">${empty_text}</div>`);
	} else {
		docs.forEach((doc, index) => {
			if (index === 0) return;
			$('#doc-list').append(
				`<div class="doc-button" id="${doc.activity_description_index.toString()}"><img src="https://uploads-ssl.webflow.com/64773d761bc76753239357f0/64b3ee5171c9469766a2c07f_document.svg" loading="eager" alt="" class="doc-icon"><div class="truncate">${
					descriptions[doc.activity_description_index].pt
				}</div></div>`
			);
		});
	}
	$('#doc-list').fadeIn();

	activateDocButtons(docs, descriptions);
}

// Handle page actions
$(document).ready(async function () {
	// Get data to display
	const urlParams = new URLSearchParams(window.location.search);
	const unit_id = urlParams.get('unit_id');
	const org_id = urlParams.get('org_id');
	const fb_token = Cookies.get('fb_token');
	let response;
	let org;
	let descriptions;

	// Get org data
	try {
		response = await fetch(`${BACKEND_URL}/docs?org_id=${org_id}&unit_id=${unit_id}`, {
			method: 'GET',
			headers: { Authorization: `Bearer ${fb_token}` },
		});
		if (!response.ok) throw new Error('Unable to fetch data');
		org = await response.json();
	} catch (error) {
		window.location.replace('/my-business');
	}

	let docs = org.docs;

	// Get activities by ID
	try {
		response = await fetch(
			`${BACKEND_URL}/industries?industry_id=${org.industry.toString()}&activity_id=${org.activity.toString()}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${fb_token}` },
			}
		);
		if (!response.ok) throw new Error('Unable to fetch data');
		descriptions = await response.json();
	} catch (error) {
		window.location.replace('/my-business');
	}

	// Populate organization section
	$('#org-name').text(org.name);
	$('#unit-address').text(org.unit_address);
	$('.org-section').fadeIn();

	resetDocs(docs, descriptions);

	// Appointment description event listener
	$('#description').change(function () {
		$('#text-content').val('');
		$('#appointment-content').val('');

		const APPOINTMENT_LABELS = ['Datas e horários disponíveis para reservas/agendamentos'];

		if (APPOINTMENT_LABELS.includes($('.current:first').text())) {
			$('.text-block').css('display', 'none');
			$('.appointment-block').css('display', 'block');
		} else {
			$('.text-block').css('display', 'block');
			$('.appointment-block').css('display', 'none');
		}
	});

	$('.tab-link').click(function () {
		$('#doc-form-wrapper').hide();
		$('#dashboard-placeholder').css('display', 'flex');
		$('#save-doc').val('Salvar conteúdo');
		$('#doc-form').trigger('reset');

		// Get tab ID
		const docs_list_id = $(this).attr('id');

		switch (docs_list_id) {
			case 'products':
				$('#btn-add-text').text('Cadastrar produto');
				break;
			case 'services':
				$('#btn-add-text').text('Cadastrar serviço');
				break;
			default:
				$('#btn-add-text').text('Cadastrar conteúdo');
				break;
		}

		resetDocs(docs, descriptions, docs_list_id);
	});

	$('.add-doc').click(function () {
		// Remove temporary buttons
		$('.temp').remove();
		$('#doc-form').trigger('reset');

		// Reset content
		$('#dashboard-placeholder').hide();
		$('#doc-form-wrapper').fadeIn();

		// Reset content input
		$('.text-block').css('display', 'block');
		$('.appointment-block').css('display', 'none');

		// Add new doc button
		$('#doc-list').prepend(`<div class="doc-button selected truncate temp">Novo conteúdo</div>`);

		// Populate descriptions
		$('.list:first').empty();

		// Get selected tab
		const docs_list_id = $('.tab-link.w--current').attr('id');

		if (docs_list_id === 'products') {
			// Update heading
			$('#dashboard-heading').text('Cadastrar novo conteúdo');

			$('#descriptions-select').hide();
			$('#name').fadeIn();
			$('#name').text('Nome do produto:');
			$('.price-block').fadeIn();
		}

		if (docs_list_id === 'services') {
			// Update heading
			$('#dashboard-heading').text('Cadastrar novo serviço');

			$('#descriptions-select').hide();
			$('#name').fadeIn();
			$('#name').text('Nome do serviço:');
			$('.price-block').fadeIn();
		}

		if (docs_list_id === 'others') {
			// Update heading
			$('#dashboard-heading').text('Cadastrar novo conteúdo');

			$('#descriptions-select').fadeIn();
			$('#name').hide();
			$('.price-block').hide();

			// Populate descriptions
			for (let i = 0; i < descriptions.length; i++) {
				// Append if the current index is not in the docs array
				if (!docs.find((doc) => doc.activity_description_index === i) && i !== 0 && i !== 1) {
					$('.list:first').append(
						`<li data-value="${i}" class="option description truncate">${descriptions[i].pt}</li>`
					);
				}
			}
		}

		$('.current:first').text('Selecione um assunto');

		// Reset button event listeners
		$('.doc-button').off('click');

		// Add event listener to new button
		activateDocButtons(docs, descriptions);

		// Make button selected
		$(`#${docs.length + 1}`)
			.addClass('selected')
			.siblings()
			.removeClass('selected');
	});

	$('#save-doc').click(async function (event) {
		event.preventDefault();
		$('#save-doc').val('Salvando...');

		const description = $('li.selected.description').data('value');
		const text = $('#text-content').val();
		const appointment = $('#appointment-content').val();

		// Validate fields
		if (typeof description == 'undefined' || (!text && !appointment)) {
			alert('Preencha todos os campos!');
			$('#save-doc').val('Salvar conteúdo');
			return;
		}

		const new_doc = {
			activity_description_index: $('li.selected.description').data('value'),
			index: $('.doc-button.selected').attr('id')
				? parseInt($('.doc-button.selected').attr('id'))
				: docs.length + 1,
			content: {},
		};

		if (text) {
			new_doc.content.category = 'text';
			new_doc.content.raw = text;
		} else {
			new_doc.content.category = 'appointment_link';
			new_doc.content.link = appointment;
		}

		try {
			response = await fetch(`${BACKEND_URL}/docs?org_id=${org_id}&unit_id=${unit_id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${fb_token}`,
				},
				body: JSON.stringify(new_doc),
			});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			} else {
				docs = await response.json();
				resetDocs(docs, descriptions);
			}
		} catch (error) {
			alert('Desculpe, houve um erro ao salvar o documento. Tente novamente mais tarde.');
			$('#save-doc').val('Salvar conteúdo');
		}
	});

	$('#confirm-delete-button').click(async function (event) {
		event.preventDefault();
		let index = $('.doc-button.selected').attr('id');

		if (typeof index == 'undefined' || isNaN(index)) {
			resetDocs(docs, descriptions);
			return;
		} else {
			index = parseInt(index);
		}

		$('#delete-button').text('Deletando...');

		try {
			response = await fetch(`${BACKEND_URL}/docs?org_id=${org_id}&unit_id=${unit_id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${fb_token}`,
				},
				body: JSON.stringify({ index }),
			});
			if (!response.ok) {
				throw new Error('Network response was not ok');
			} else {
				$('#delete-button').text('Deletar');
				docs = await response.json();
				resetDocs(docs, descriptions);
			}
		} catch (error) {
			if (alert('Desculpe, houve um erro ao deletar o documento. Tente novamente mais tarde.')) {
				location.reload();
				$('#delete-button').text('Deletar documento');
			}
		}
	});
});
