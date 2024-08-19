import { codeBlock } from 'common-tags';
import { Fixtures } from '../../../../test/fixtures';
import { fs } from '../../../../test/util';
import { extractPackageFile } from '.';

jest.mock('../../../util/fs');

const pdmPyProject = Fixtures.get('pyproject_with_pdm.toml');
const pdmSourcesPyProject = Fixtures.get('pyproject_pdm_sources.toml');

describe('modules/manager/pep621/extract', () => {
  describe('extractPackageFile()', () => {
    it('should return null for empty content', async () => {
      const result = await extractPackageFile('', 'pyproject.toml');
      expect(result).toBeNull();
    });

    it('should return null for invalid toml', async () => {
      const result = await extractPackageFile(
        codeBlock`
        [project]
        name =
      `,
        'pyproject.toml',
      );
      expect(result).toBeNull();
    });

    it('should return dependencies for valid content', async () => {
      const result = await extractPackageFile(pdmPyProject, 'pyproject.toml');

      expect(result).toMatchObject({
        extractedConstraints: {
          python: '>=3.7',
        },
      });
      const dependencies = result?.deps.filter(
        (dep) => dep.depType === 'project.dependencies',
      );
      expect(dependencies).toEqual([
        {
          packageName: 'blinker',
          depName: 'blinker',
          datasource: 'pypi',
          depType: 'project.dependencies',
          skipReason: 'unspecified-version',
        },
        {
          packageName: 'packaging',
          depName: 'packaging',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=20.9,!=22.0',
        },
        {
          packageName: 'rich',
          depName: 'rich',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=12.3.0',
        },
        {
          packageName: 'virtualenv',
          depName: 'virtualenv',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '==20.0.0',
          currentVersion: '20.0.0',
        },
        {
          packageName: 'pyproject-hooks',
          depName: 'pyproject-hooks',
          datasource: 'pypi',
          depType: 'project.dependencies',
          skipReason: 'unspecified-version',
        },
        {
          packageName: 'unearth',
          depName: 'unearth',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=0.9.0',
        },
        {
          packageName: 'tomlkit',
          depName: 'tomlkit',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=0.11.1,<1',
        },
        {
          packageName: 'installer',
          depName: 'installer',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '<0.8,>=0.7',
        },
        {
          packageName: 'cachecontrol',
          depName: 'cachecontrol',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=0.12.11',
        },
        {
          packageName: 'tomli',
          depName: 'tomli',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=1.1.0',
        },
        {
          packageName: 'typing-extensions',
          depName: 'typing-extensions',
          datasource: 'pypi',
          depType: 'project.dependencies',
          skipReason: 'unspecified-version',
        },
        {
          packageName: 'importlib-metadata',
          depName: 'importlib-metadata',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=3.6',
        },
      ]);

      const optionalDependencies = result?.deps.filter(
        (dep) => dep.depType === 'project.optional-dependencies',
      );
      expect(optionalDependencies).toEqual([
        {
          packageName: 'pytest',
          datasource: 'pypi',
          depType: 'project.optional-dependencies',
          currentValue: '>12',
          depName: 'pytest',
        },
        {
          packageName: 'pytest-mock',
          datasource: 'pypi',
          depType: 'project.optional-dependencies',
          skipReason: 'unspecified-version',
          depName: 'pytest-mock',
        },
      ]);

      const pdmDevDependencies = result?.deps.filter(
        (dep) => dep.depType === 'tool.pdm.dev-dependencies',
      );
      expect(pdmDevDependencies).toEqual([
        {
          packageName: 'pdm',
          datasource: 'pypi',
          depType: 'tool.pdm.dev-dependencies',
          skipReason: 'unspecified-version',
          depName: 'pdm',
        },
        {
          packageName: 'pytest-rerunfailures',
          datasource: 'pypi',
          depType: 'tool.pdm.dev-dependencies',
          currentValue: '>=10.2',
          depName: 'pytest-rerunfailures',
        },
        {
          packageName: 'tox',
          datasource: 'pypi',
          depType: 'tool.pdm.dev-dependencies',
          skipReason: 'unspecified-version',
          depName: 'tox',
        },
        {
          packageName: 'tox-pdm',
          datasource: 'pypi',
          depType: 'tool.pdm.dev-dependencies',
          currentValue: '>=0.5',
          depName: 'tox-pdm',
        },
      ]);
    });

    it('should return dependencies with overwritten pypi registryUrl', async () => {
      const result = await extractPackageFile(
        pdmSourcesPyProject,
        'pyproject.toml',
      );

      expect(result?.deps).toEqual([
        {
          packageName: 'blinker',
          depName: 'blinker',
          datasource: 'pypi',
          depType: 'project.dependencies',
          skipReason: 'unspecified-version',
          registryUrls: [
            'https://private-site.org/pypi/simple',
            'https://private.pypi.org/simple',
          ],
        },
        {
          packageName: 'packaging',
          depName: 'packaging',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=20.9,!=22.0',
          registryUrls: [
            'https://private-site.org/pypi/simple',
            'https://private.pypi.org/simple',
          ],
        },
        {
          packageName: 'pytest',
          datasource: 'pypi',
          depType: 'project.optional-dependencies',
          currentValue: '>12',
          depName: 'pytest',
          registryUrls: [
            'https://private-site.org/pypi/simple',
            'https://private.pypi.org/simple',
          ],
        },
        {
          packageName: 'pytest-rerunfailures',
          datasource: 'pypi',
          depType: 'tool.pdm.dev-dependencies',
          currentValue: '>=10.2',
          depName: 'pytest-rerunfailures',
          registryUrls: [
            'https://private-site.org/pypi/simple',
            'https://private.pypi.org/simple',
          ],
        },
        {
          packageName: 'tox-pdm',
          datasource: 'pypi',
          depType: 'tool.pdm.dev-dependencies',
          currentValue: '>=0.5',
          depName: 'tox-pdm',
          registryUrls: [
            'https://private-site.org/pypi/simple',
            'https://private.pypi.org/simple',
          ],
        },
      ]);
    });

    it('should return dependencies with original pypi registryUrl', async () => {
      const result = await extractPackageFile(
        codeBlock`
      [project]
      dependencies = [
        "packaging>=20.9,!=22.0",
      ]

      [[tool.pdm.source]]
      url = "https://private-site.org/pypi/simple"
      verify_ssl = true
      name = "internal"
      `,
        'pyproject.toml',
      );

      expect(result?.deps).toEqual([
        {
          packageName: 'packaging',
          depName: 'packaging',
          datasource: 'pypi',
          depType: 'project.dependencies',
          currentValue: '>=20.9,!=22.0',
          registryUrls: [
            'https://pypi.org/pypi/',
            'https://private-site.org/pypi/simple',
          ],
        },
      ]);
    });

    it('should extract dependencies from hatch environments', async () => {
      const hatchPyProject = Fixtures.get('pyproject_with_hatch.toml');
      const result = await extractPackageFile(hatchPyProject, 'pyproject.toml');

      expect(result?.deps).toEqual([
        {
          currentValue: '==2.30.0',
          currentVersion: '2.30.0',
          datasource: 'pypi',
          depName: 'requests',
          depType: 'project.dependencies',
          packageName: 'requests',
        },
        {
          datasource: 'pypi',
          depName: 'hatchling',
          depType: 'build-system.requires',
          packageName: 'hatchling',
          skipReason: 'unspecified-version',
        },
        {
          currentValue: '==6.5',
          currentVersion: '6.5',
          datasource: 'pypi',
          depName: 'coverage',
          depType: 'tool.hatch.envs.default',
          packageName: 'coverage',
        },
        {
          datasource: 'pypi',
          depName: 'pytest',
          depType: 'tool.hatch.envs.default',
          packageName: 'pytest',
          skipReason: 'unspecified-version',
        },
        {
          currentValue: '>=23.1.0',
          datasource: 'pypi',
          depName: 'black',
          depType: 'tool.hatch.envs.lint',
          packageName: 'black',
        },
        {
          datasource: 'pypi',
          depName: 'baz',
          depType: 'tool.hatch.envs.experimental',
          packageName: 'baz',
          skipReason: 'unspecified-version',
        },
      ]);
    });

    it('should extract project version', async () => {
      const content = codeBlock`
        [project]
        name = "test"
        version = "0.0.2"
        dependencies = [ "requests==2.30.0" ]
      `;

      const res = await extractPackageFile(content, 'pyproject.toml');
      expect(res?.packageFileVersion).toBe('0.0.2');
    });

    it('should extract dependencies from build-system.requires', async () => {
      const content = codeBlock`
        [build-system]
        requires = ["hatchling==1.18.0", "setuptools==69.0.3"]
        build-backend = "hatchling.build"

        [project]
        name = "test"
        version = "0.0.2"
        dependencies = [ "requests==2.30.0" ]
      `;
      const result = await extractPackageFile(content, 'pyproject.toml');

      expect(result?.deps).toEqual([
        {
          currentValue: '==2.30.0',
          currentVersion: '2.30.0',
          datasource: 'pypi',
          depName: 'requests',
          depType: 'project.dependencies',
          packageName: 'requests',
        },
        {
          currentValue: '==1.18.0',
          currentVersion: '1.18.0',
          datasource: 'pypi',
          depName: 'hatchling',
          depType: 'build-system.requires',
          packageName: 'hatchling',
        },
        {
          currentValue: '==69.0.3',
          currentVersion: '69.0.3',
          datasource: 'pypi',
          depName: 'setuptools',
          depType: 'build-system.requires',
          packageName: 'setuptools',
        },
      ]);
    });

    it('should resolve lockedVersions from pdm.lock', async () => {
      fs.readLocalFile.mockResolvedValue(
        Fixtures.get('pyproject_pdm_lockedversion.lock'),
      );

      const res = await extractPackageFile(
        Fixtures.get('pyproject_pdm_lockedversion.toml'),
        'pyproject.toml',
      );
      expect(res).toMatchObject({
        extractedConstraints: { python: '>=3.11' },
        deps: [
          {
            packageName: 'jwcrypto',
            depName: 'jwcrypto',
            datasource: 'pypi',
            depType: 'project.dependencies',
            currentValue: '>=1.4.1',
            lockedVersion: '1.4.1',
          },
          {
            packageName: 'pdm-backend',
            depName: 'pdm-backend',
            datasource: 'pypi',
            depType: 'build-system.requires',
            skipReason: 'unspecified-version',
          },
        ],
      });
    });
  });
});
