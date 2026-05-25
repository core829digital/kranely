const en = {
  // ── App Meta ──────────────────────────────────────────────────────────────
  app: {
    name: 'Kranely',
    tagline: 'Window & Door Management Platform',
    description: 'The all-in-one platform for window and door installers.',
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  nav: {
    dashboard:    'Dashboard',
    clients:      'Clients',
    suppliers:    'Suppliers',
    quotes:       'Quotes',
    projects:     'Projects',
    payments:     'Payments',
    documents:    'Documents',
    messages:     'Messages',
    appointments: 'Appointments',
    certificates: 'Certificates',
    tasks:        'Tasks',
    settings:     'Settings',
    staff:        'Staff',
    collaborators:'Collaborators',
    reports:      'Reports',
    logout:       'Log out',
    workflow:     'Workflow',
    crm:          'CRM & Admin',
    admin:        'Admin Panel',
    marketing:    'Marketing',
    archive:      'Archive & Chat',
    shared:       'Shared',
    storage:      'Storage',
    whitelabel:   'White Label',
    dailylogs:    'Time Logs'
  },

  // ── Auth ─────────────────────────────────────────────────────────────────
  auth: {
    sign_in:          'Sign in',
    sign_up:          'Sign up',
    pending_activation: 'Account pending activation',
    pending_message:  'Your account has been registered. An administrator will assign your role shortly.',
    blocked:          'Account blocked',
    contact_support:  'Contact support: support@kranely.com',
    logout:           'Log out',
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    title:         'Dashboard',
    welcome:       'Welcome back',
    total_revenue: 'Total Revenue',
    active_projects: 'Active Projects',
    pending_quotes:  'Pending Quotes',
    unread_messages: 'Unread Messages',
    project_status:  'Project Status',
    recent_activity: 'Recent Activity',
    quick_actions:   'Quick Actions',
    active:          'Active',
    paused:          'Paused',
    completed:       'Completed',
    delayed:         'Delayed',
    view_all:        'View All',
    create_new:      'Create New',
    no_activity:     'No recent activity',
    today:           'Today',
    this_week:       'This Week',
    this_month:      'This Month',
    revenue:        'Revenue',
    quotes_sent:     'Quotes Sent',
    projects_completed: 'Projects Completed'
  },

  // ── Clients ───────────────────────────────────────────────────────────────
  clients: {
    title:        'Clients',
    new_client:   'New Client',
    full_name:    'Full Name',
    email:        'Email',
    phone:        'Phone',
    address:      'Address',
    company:      'Company',
    type:         'Type',
    b2b:          'Business (B2B)',
    b2c:          'Individual (B2C)',
    status:       'Status',
    lead:         'Lead',
    active:       'Active',
    archived:     'Archived',
    notes:        'Notes',
    vat_number:   'VAT Number',
    fiscal_code:  'Fiscal Code',
    add_client:   'Add Client',
    edit_client:  'Edit Client',
    delete_client:'Delete Client',
    search:       'Search clients...',
    no_clients:   'No clients found.',
    select:       'Select client...',
  },

  // ── Suppliers ─────────────────────────────────────────────────────────────
  suppliers: { 
    title:          'Suppliers',
    select:         'Select supplier...',
    new_supplier:   'New Supplier',
    company_name:   'Company Name',
    contact_person: 'Contact Person',
    email:          'Email',
    phone:          'Phone',
    category:       'Category',
    windows:        'Windows',
    doors:          'Doors',
    hardware:       'Hardware',
    glass:          'Glass',
    insulation:     'Insulation',
    other:          'Other',
    status:        'Status',
    active:         'Active',
    inactive:       'Inactive',
    requests:       'Requests',
    production:    'Production',
    documents:      'Documents',
    calendar:       'Calendar',
    payments:      'Payments',
    new_request:    'New Request',
    manual_request: 'Manual Request',
    search:        'Search suppliers...',
    no_suppliers:   'No suppliers found.',
    send_invite:    'Send Invite',
    view_profile:   'View Profile'
  },

  // ── Quotes ────────────────────────────────────────────────────────────────
  quotes: { 
    title:          'Quotes',
    new_quote:     'New Quote',
    quote_number:  'Quote No.',
    client:         'Client',
    amount:         'Amount',
    status:         'Status',
    draft:          'Draft',
    sent:           'Sent',
    accepted:       'Accepted',
    rejected:       'Rejected',
    expired:        'Expired',
    date:           'Date',
    valid_until:    'Valid Until',
    items:          'Items',
    subtotal:       'Subtotal',
    tax:            'VAT',
    total:          'Total',
    notes:          'Notes',
    send_quote:     'Send Quote',
    accept:         'Accept',
    reject:         'Reject',
    counter_offer:  'Counter Offer',
    create_new:     'Create New Quote',
    no_quotes:      'No quotes found.',
    enter_final_price: 'Enter final price...',
    select_request: 'Select request...'
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  projects: { 
    title:          'Projects',
    new_project:   'New Project',
    project_name:   'Project Name',
    client:         'Client',
    supplier:       'Supplier',
    start_date:     'Start Date',
    end_date:       'End Date',
    status:         'Status',
    active:         'Active',
    paused:         'Paused',
    completed:     'Completed',
    delayed:        'Delayed',
    phases:         'Phases',
    assign_staff:   'Assign Staff',
    production:     'Production',
    delivery:       'Delivery',
    installation:   'Installation'
  },

  // ── Payments ───────────────────────────────────────────────────────────────
  payments: { 
    title:             'Payments',
    new_payment:       'New Payment',
    settings:          'Payment Settings',
    client_payments:    'Client Payments',
    supplier_payments:'Supplier Payments',
    total_received:     'Total Received',
    total_paid:        'Total Paid',
    deposit:           'Initial Deposit',
    installment:       'Installment',
    balance:           'Final Balance',
    amount:            'Amount',
    date:              'Date',
    status:            'Status',
    pending:           'Pending',
    paid:              'Paid',
    overdue:           'Overdue',
    invoice:           'Invoice',
    receipt:           'Receipt',
    generate_pdf:      'Generate PDF',
    subtitle_admin:    'Track all collections and payments',
    subtitle_supplier: 'Payments received from Kranely',
    subtitle_client:   'Your payments and receipts'
  },

  // ── Documents ─────────────────────────────────────────────────────────────
  documents: { 
    title:         'Documents',
    upload:        'Upload',
    folder:        'Folder',
    by_client:     'View by Client',
    by_request:    'View by Request',
    download:      'Download',
    rename:        'Rename',
    delete:        'Delete',
    type:          'Type',
    date:          'Date',
    size:          'Size',
    search:        'Search documents...',
    no_documents:  'No documents found.',
    certificate:   'Certificate',
    contract:      'Contract',
    invoice:       'Invoice',
    quote:         'Quote',
    other:         'Other'
  },

  // ── Messages ─────────────────────────────────────────────────────────────
  messages: { 
    title:           'Messages',
    new_message:     'New Message',
    search:          'Search conversations...',
    suppliers:       'Suppliers',
    collaborators:  'Collaborators',
    clients_b2b:    'Clients (B2B)',
    clients_b2c:     'Clients (B2C)',
    type_message:   'Write a message...',
    send:            'Send',
    attach_file:     'Attach file',
    call:            'Call',
    no_messages:    'No messages yet.',
    mention_hint:    'Type @ to mention a quote or order'
  },

  // ── Appointments ─────────────────────────────────────────────────────────
  appointments: { 
    title:           'Appointments',
    new_appointment: 'New Appointment',
    date:            'Date',
    time:            'Time',
    client:          'Client',
    type:            'Type',
    visit:           'Site Visit',
    measurement:    'Measurement',
    installation:   'Installation',
    delivery:        'Delivery',
    follow_up:       'Follow-up',
    status:          'Status',
    pending:         'Pending',
    confirmed:       'Confirmed',
    rejected:        'Rejected',
    notes:           'Notes',
    weekly:          'Week',
    biweekly:        'Two Weeks',
    monthly:        'Month'
  },

  // ── Certificates ────────────────────────────────────────────────────────
  certificates: { 
    title:           'Certificates',
    new_cert:        'New Certificate',
    type:            'Type',
    quality:         'Quality Certificate',
    conformity:      'Certificate of Conformity',
    warranty:        'Warranty Certificate',
    energy:          'Energy Certificate',
    issued_date:     'Issue Date',
    expiry_date:     'Expiry Date',
    client:          'Client',
    project:         'Project',
    download_pdf:    'Download PDF',
    no_certs:        'No certificates found.'
  },

  // ── Staff ─────────────────────────────────────────────────────────────────
  staff: { 
    title:          'Staff',
    new_member:     'Add Member',
    role:           'Role',
    name:           'Name',
    email:          'Email',
    phone:          'Phone',
    generate_qr:    'Generate QR Code',
    qr_valid:       'Valid for 24 hours',
    qr_log:         'QR Log',
    active:         'Active',
    inactive:       'Inactive'
  },

  // ── Settings ────────────────────────────────────────────────────────────
  settings: { 
    title:            'Settings',
    profile:          'Profile',
    organization:     'Organization',
    billing:          'Billing',
    notifications:    'Notifications',
    language:         'Language',
    theme:            'Theme',
    security:         'Security',
    whitelabel:       'White Label',
    whitelabel_desc:  'Customize the platform branding for your organization',
    logo:             'Logo',
    primary_color:    'Primary Color',
    app_name:         'App Name',
    domain:           'Custom Domain',
    save:             'Save',
    saved:            'Saved!'
  },

  // ── Common ────────────────────────────────────────────────────────────────
  common: { 
    save:             'Save', 
    cancel:           'Cancel', 
    delete:           'Delete', 
    edit:             'Edit', 
    create:           'Create', 
    update:           'Update', 
    close:            'Close', 
    confirm:          'Confirm', 
    back:             'Back', 
    next:             'Next', 
    loading:          'Loading...', 
    error:            'An error occurred.', 
    success:          'Done!', 
    search:           'Search...', 
    filter:           'Filter', 
    sort:             'Sort', 
    export:           'Export', 
    import:           'Import', 
    view:             'View', 
    details:          'Details', 
    all:              'All', 
    none:             'None', 
    yes:              'Yes', 
    no:               'No', 
    or:               'or', 
    and:              'and', 
    required:         'Required', 
    optional:         'Optional', 
    not_found:        'Not found', 
    no_results:       'No results', 
    page:             'Page', 
    of:               'of', 
    rows_per_page:    'Rows per page', 
    today:            'Today', 
    yesterday:        'Yesterday', 
    this_week:        'This week', 
    this_month:       'This month',
    download:           'Download',
    upload:             'Upload',
    restore:            'Restore',
    archive:           'Archive',
    sync_clerk:        'Sync from Clerk',
    no_users:          'No users available',
    will_be_promoted:  'User will be promoted to client role automatically.',
    open_document: 'Open Document',
    new_supplier: 'New Supplier',
    new_request: 'New Request',
    new_delivery: 'New Delivery',
    save_date: 'Save Date',
    new_payment: 'New Payment',
    new_certificate: 'New Certificate',
    new_collaborator: 'New Collaborator',
    new_quote_request: 'New Quote Request',
    send_photos_details: 'Send photos and details to receive a personalised quote.',
    request_subject: 'Request subject',
    new_requests: 'New Requests',
    new_photo_request: 'New Photo/Request',
    status: {
      active: 'Active',
      inactive: 'Inactive',
      archived: 'Archived',
      lead: 'Lead',
      on_leave: 'On Leave',
      in_transit: 'In Transit',
      delivered: 'Delivered',
      confirmed: 'Confirmed',
      in_production: 'In Production',
      ready: 'Ready',
      shipped: 'Shipped',
      sent: 'Sent',
      received: 'Received',
      quoted: 'Quoted',
      accepted: 'Accepted',
      rejected: 'Rejected',
      draft: 'Draft',
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
      dispatched: 'Dispatched'
    },
    form: {
      select_option: 'Select an option',
      select_type: 'Select type...',
      select_supplier: 'Select Supplier *',
      select_order: 'Select Order *',
      select_client: 'Select client...',
      select_quote: 'Select accepted quote...',
      select_document: 'Select a document...',
      select_project: 'Select project',
      search_certificates: 'Search certificates...',
      search_suppliers: 'Search suppliers...',
      search_orders: 'Search orders, deliveries, tracking...',
      search_suppliers_orders: 'Search suppliers, orders, deliveries...',
      search_project: 'Search project...',
      search_documents: 'Search documents...',
      search_articles: 'Search articles...',
      search_by_date: 'Search by date or activity...',
      document_name: 'Document Name',
      project_estimate: 'Project Estimate',
      default_value: 'Default Value',
      no_deadline: 'No deadline',
      no_description: 'No description.',
      address_not_specified: 'Address not specified'
    },
    empty_state: {
      no_quotes: 'No quotes',
      no_payments: 'No payments',
      no_projects: 'No projects',
      no_documents: 'No documents',
      no_messages: 'No messages',
      no_results: 'No results',
      no_notes: 'No additional notes.',
      write_to_communicate: 'Write to communicate with this contact.'
    },
    actions: {
      delete_permanently: 'Delete Permanently',
      deleting: 'Deleting...',
      uploading: 'Uploading...',
      create_certificate: 'Create Certificate',
      create_collaborator: 'Create Collaborator',
      upload_failed: 'Upload failed',
      upload_error: 'Upload error',
      delete_confirm: 'Delete this item?',
      delete_confirm_supplier: 'Delete this supplier? All related data will be lost.',
      delete_confirm_collaborator: 'Delete this collaborator?',
      delete_confirm_code: 'Delete this code? The action is not reversible.',
      delete_confirm_invoice: 'Delete this invoice?'
    },
    private_area: {
      view_compensation: 'View compensation details',
      view_earnings: 'View your earnings and compensation',
      view_manage_quotes: 'View and manage your quote requests',
      view_link_quotes: 'View and link quotes to projects'
    },
    quote: {
      edit_quote: 'Edit Quote',
      new_quote: 'New Quote',
      edit_invoice: 'Edit Invoice',
      new_invoice: 'New Invoice',
      edit_signature: 'Edit Signature',
      add_signature: 'Add Signature'
    },
    appointments: {
      my_appointments: 'My Appointments',
      all_appointments: 'All Appointments'
    }
  },

  // ── Whitelabel ────────────────────────────────────────────────────────────
  whitelabel: { 
    title:           'White Label',
    description:     'Customize the platform for your business',
    app_name:        'App Name',
    tagline:         'Tagline',
    logo_url:        'Logo URL',
    primary_color:   'Primary Color (accent)',
    dark_color:      'Dark Color',
    light_color:     'Light Color (background)',
    custom_domain:  'Custom Domain',
    email_from:      'Sender Name',
    support_email:  'Support Email',
    enable:          'Enable White Label',
    preview:         'Preview',
    save:            'Save Branding',
    reset:           'Reset to Default'
  },

  // ── Errors ────────────────────────────────────────────────────────────────
  errors: { 
    not_found:       '404 — Page not found', 
    unauthorized:    'You are not authorized to view this page.', 
    server_error:    'Server error. Please try again.', 
    network_error:   'Network error. Check your connection.'
  },

  // ── Landing ───────────────────────────────────────────────────────────────
  landing: {
    hero: { 
      badge:           'Platform 2.0 is Live', 
      title:           'Window Management', 
      title_accent:    'made perfectly simple.', 
      subtitle:       'The ultimate operating system for window and door professionals. Unify your CRM, supplier network, quick quotes, and project tracking in one workspace.', 
      cta:            'Start Your Workspace'
    },
    services: { 
      title:           'Everything You Need', 
      subtitle:        'Manage every aspect of your business with powerful, easy-to-use tools.',
      crm: { 
        title:         'Complete CRM', 
        description:   'Manage clients, leads, and opportunities with a CRM designed specifically for the window and door industry.'
      },
      quotes: { 
        title:         'Quick Quotes', 
        description:   'Create professional quotes in minutes with automatic calculations and customizable templates.'
      },
      projects: { 
        title:         'Project Management', 
        description:   'Track every phase of your projects, from measurement to final installation.'
      },
      suppliers: { 
        title:         'Supplier Network', 
        description:   'Coordinate suppliers, orders, and deliveries in one place.'
      },
      mobile: { 
        title:         'Mobile App', 
        description:   'Access your data anywhere with our dedicated mobile app.'
      },
      reports: { 
        title:         'Advanced Reports', 
        description:   'Analyze your company performance with detailed reports and real-time analytics.'
      }
    },
    stats: { 
      title: 'Kranely by the Numbers', 
      clients: 'Clients', 
      projects: 'Projects', 
      quotes: 'Quotes', 
      years: 'Years of Experience'
    },
    testimonials: { 
      title: 'What Our Clients Say', 
      author: 'CEO,', 
      role:  'Company'
    },
    cta: { 
      title:          'Ready to Transform Your Business?', 
      subtitle:       'Start for free today. No credit card required.', 
      cta:            'Start Free', 
      login:          'Sign in to your account'
    },
    footer: { 
      product:     'Product', 
      company:     'Company', 
      legal:       'Legal', 
      contact:     'Contact', 
      about:       'About Us', 
      careers:     'Careers', 
      blog:        'Blog', 
      pricing:     'Pricing', 
      features:    'Features', 
      integrations:'Integrations', 
      roadmap:     'Roadmap', 
      security:    'Security', 
      status:      'Status', 
      privacy:     'Privacy', 
      terms:       'Terms', 
      cookies:     'Cookies', 
      all_rights:  'All rights reserved.'
    }
  },

  // ── Quote Types ───────────────────────────────────────────────────────────
  quote_types: { 
    finestre:      'Windows & Doors', 
    chiavi_in_mano: 'Turnkey', 
    completo:       'Complete Project'
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: { 
    save:            'Save', 
    cancel:          'Cancel', 
    delete:          'Delete', 
    edit:            'Edit', 
    create:          'Create', 
    update:          'Update', 
    close:           'Close', 
    confirm:         'Confirm', 
    back:            'Back', 
    next:            'Next', 
    submit:          'Submit', 
    download:        'Download', 
    upload:          'Upload', 
    view:            'View', 
    search:          'Search', 
    filter:          'Filter', 
    export:          'Export', 
    import:          'Import', 
    refresh:         'Refresh', 
    loading:         'Loading...', 
    no_results:      'No results'
  },

  // ── Status ────────────────────────────────────────────────────────────────
  status: { 
    active:       'Active', 
    inactive:     'Inactive', 
    pending:      'Pending', 
    confirmed:    'Confirmed', 
    rejected:     'Rejected', 
    completed:    'Completed', 
    cancelled:    'Cancelled', 
    expired:      'Expired', 
    paused:       'Paused', 
    delayed:      'Delayed', 
    sent:         'Sent', 
    accepted:     'Accepted', 
    declined:      'Declined', 
    draft:        'Draft', 
    published:    'Published', 
    archived:     'Archived', 
    paid:         'Paid', 
    overdue:      'Overdue', 
    partial:      'Partial'
  },

  // ── Form ─────────────────────────────────────────────────────────────────
  form: { 
    required:       'Required', 
    optional:        'Optional', 
    select_option:   'Select an option', 
    name:            'Name', 
    surname:         'Surname', 
    email:           'Email', 
    phone:           'Phone', 
    address:         'Address', 
    city:            'City', 
    region:          'Region', 
    zip:             'ZIP', 
    country:         'Country', 
    company:         'Company', 
    vat_number:      'VAT Number', 
    fiscal_code:     'Fiscal Code', 
    notes:           'Notes', 
    description:     'Description', 
    amount:          'Amount', 
    date:            'Date', 
    time:            'Time', 
    password:        'Password', 
    confirm_password:'Confirm password', 
    subject:         'Subject', 
    message:         'Message'
  },

  // ── Dialogs ──────────────────────────────────────────────────────────────
  dialogs: { 
    confirm_delete:   'Are you sure you want to delete?', 
    confirm_action:    'Are you sure you want to proceed?', 
    unsaved_changes:   'You have unsaved changes. Do you want to leave?'
  },

  // ── Collaborators ────────────────────────────────────────────────────────
  collaborators: {
    title:            'Collaborators',
    subtitle:         'Manage internal staff, external collaborators, hours and attendance',
    new:              'New Collaborator',
    log_hours:        'Log Hours',
    search:           'Search collaborators...',
    select_collaborator: 'Select Collaborator *',
    select_project:   'Select Project (Optional)',
    hours_placeholder: 'e.g. 8',
    description_placeholder: 'Description / Note (Optional)',
    no_results:       'No collaborators found',
    internal:         'Internal',
    external:         'External',
    all:              'All',
    anagrafica:        'Profile',
    ore:              'Hours',
    pagamenti:        'Payments',
    chat:             'Chat',
    full_name:        'Full Name',
    email:            'Email',
    phone:            'Phone',
    type:             'Type',
    job_title:        'Job Title',
    fiscal_code:      'Fiscal Code',
    contract_type:    'Contract Type',
    tempo_pieno:      'Full Time',
    part_time:        'Part Time',
    freelance:       'Freelance',
    hourly_rate:      'Hourly Rate',
    salary:           'Salary',
    payment_frequency:'Payment Frequency',
    monthly:          'Monthly',
    bimonthly:        'Bimonthly',
    weekly:           'Weekly',
    location_type:    'Work Type',
    on_site:          'On Site',
    remote:           'Remote',
    hybrid:           'Hybrid',
    notes:            'Notes',
    contract_start:   'Contract Start',
    contract_end:     'Contract End',
    assigned_projects:'Assigned Projects',
    contract:         'Contract',
    generate_link:     'Generate Access Link',
    status: {
      in_cantiere:   'On Site',
      in_ufficio:    'In Office',
      disponibile:   'Available',
      non_disponibile:'Unavailable'
    },
    stats: {
      total:           'Total',
      active:          'Active',
      hours_this_month:'Hours This Month',
      pending_approval: 'Pending Approval',
      total_paid:      'Total Paid'
    },
    hours: {
      date:            'Date',
      hours:           'Hours',
      description:     'Description',
      project:        'Project',
      approve:         'Approve',
      reject:          'Reject',
      pending:         'Pending',
      approved:        'Approved'
    },
    delete_confirm:      'Delete this collaborator?',
    create_success:     'Collaborator created successfully',
    generate_onboarding: 'Generate WhatsApp access link now?'
  },

  // ── Access ────────────────────────────────────────────────────────────────
  access: {
    denied:         'Access Denied',
    no_permission:  'You do not have permission to access this section.'
  },

  // ── Certificates ────────────────────────────────────────────────────────
  certificates: {
    title:          'Certificates',
    subtitle:       'Manage building, windows & door certificates with expiry tracking',
    worker_subtitle: 'View your personal documents and certifications',
    new:            'New Certificate',
    search:         'Search certificates...',
    no_results:     'No certificates found',
    stats: {
      total:        'Total',
      valid:        'Valid',
      expiring:     'Expiring Soon',
      expired:      'Expired',
      edilizia:     'Building',
      infissi:      'Windows',
      documents:    'Documents'
    },
    status: {
      valid:        'Valid',
      expiring:     'Expiring Soon',
      expired:      'Expired'
    },
    categories: {
      edilizia:     'Building',
      infissi:      'Windows',
      documenti:    'Documents'
    }
  },

  // ── Admin ────────────────────────────────────────────────────────────────
  admin: {
    title:          'Admin Panel',
    subtitle:       'Manage users, roles and permissions',
    search_user:    'Search user...',
    block_reason:  'Block reason (optional)...',
    no_results:     'No users found'
  },

  // ── Tasks ────────────────────────────────────────────────────────────────
  tasks: {
    title:          'Tasks',
    subtitle:       'Manage all tasks assigned across your sites.',
    back_dashboard: 'Back to Dashboard',
    todo:           'To Do',
    completed:      'Completed',
    in_progress:    'In Progress',
    no_tasks:       'No tasks found',
    pending:        'Pending',
    overdue:        'Overdue'
  },

  // ── Cantieri ─────────────────────────────────────────────────────────────
  cantieri: {
    title:            'Projects',
    subtitle:         'Manage your projects and sites',
    new:              'New Project',
    search:           'Search projects...',
    no_results:       'No projects found',
    in_production:    'In Production',
    installation:     'Installation',
    completed:        'Completed',
    details:          'Details',
    team:             'Team',
    documents:       'Documents',
    notes:            'Notes',
    assign_client:    'Assign Client',
    assign_supplier:  'Assign Supplier'
  },

  // ── Settings ───────────────────────────────────────────────────────────
  settings: {
    title:           'Settings',
    profile:         'Profile',
    company:         'Company',
    phone:           'Phone',
    work_sector:     'Work Sector',
    sector_placeholder: 'e.g., Architecture, Construction, Private',
    organization:    'Organization',
    billing:         'Billing',
    notifications:   'Notifications',
    security:        'Security',
    whitelabel:      'White Label',
    language:        'Language',
    theme:           'Theme',
    save:            'Save',
    saved:           'Saved!'
  },

  // ── Daily Logs ───────────────────────────────────────────────────────────
  dailylogs: {
    title:          'Daily Logs',
    subtitle:       'View your logged hours',
    search:         'Search logs...',
    no_results:     'No logs found',
    hours:          'Hours',
    date:           'Date',
    project:        'Project',
    description:    'Description',
    approved:       'Approved',
    pending:        'Pending',
    total_hours:    'Total Hours'
  }
};

export default en;
