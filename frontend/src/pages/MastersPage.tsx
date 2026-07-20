import { useState } from 'react';
import { Boxes, FolderTree, Ruler, Tags } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { MasterSection, type MasterConfig } from '@/components/masters/MasterSection';
import { categoriesApi, brandsApi, unitsApi } from '@/services/masters.service';
import { cn } from '@/lib/utils';

const tabs: { id: string; label: string; icon: typeof Tags; config: MasterConfig }[] = [
  {
    id: 'categories',
    label: 'Categories',
    icon: FolderTree,
    config: {
      queryKey: 'categories',
      api: categoriesApi,
      singular: 'Category',
      plural: 'Categories',
      icon: FolderTree,
      secondaryField: {
        key: 'description',
        label: 'Description',
        placeholder: 'Optional description',
        type: 'textarea',
      },
    },
  },
  {
    id: 'brands',
    label: 'Brands',
    icon: Tags,
    config: {
      queryKey: 'brands',
      api: brandsApi,
      singular: 'Brand',
      plural: 'Brands',
      icon: Tags,
      secondaryField: {
        key: 'description',
        label: 'Description',
        placeholder: 'Optional description',
        type: 'textarea',
      },
    },
  },
  {
    id: 'units',
    label: 'Units',
    icon: Ruler,
    config: {
      queryKey: 'units',
      api: unitsApi,
      singular: 'Unit',
      plural: 'Units',
      icon: Ruler,
      secondaryField: {
        key: 'shortName',
        label: 'Short name',
        placeholder: 'e.g. pcs, kg, box',
        type: 'text',
      },
    },
  },
];

export default function MastersPage() {
  const [active, setActive] = useState('categories');
  const activeTab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div>
      <PageHeader
        title="Masters"
        description="Manage the categories, brands and units used across your catalogue."
        icon={<Boxes className="h-5 w-5" />}
      />

      {/* Tab switcher */}
      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <MasterSection key={activeTab.id} config={activeTab.config} />
    </div>
  );
}
